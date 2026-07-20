import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

type GetEbookUrlInput = { bookId?: string };

/** Signed URLs live this long. Short enough that a leaked link expires fast. */
const SIGNED_URL_TTL_MS = 10 * 60 * 1000;

/**
 * Issue a short-lived read URL for a borrowed eBook — the server-side gate that
 * replaces handing out permanent bearer URLs.
 *
 * Trust nothing from the client except the caller's verified auth token. We
 * re-check the loan here (active, non-returned borrowRecord for this uid+book)
 * because Firestore/Storage rules can't express "issue bytes only to an active
 * borrower" across collections.
 *
 * Storage-hosted titles → a V4 signed URL to `ebookStoragePath`.
 * Legacy Drive-only titles (no storage path) → a typed `legacy-drive` result so
 * the client can fall back to the ungated Drive preview until migration.
 */
export const getEbookUrl = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const uid = request.auth.uid;

    const { bookId } = (request.data ?? {}) as GetEbookUrlInput;
    if (!bookId) throw new HttpsError('invalid-argument', 'bookId is required.');

    const db = getFirestore();

    // Active-loan check (mirror of client canUserAccessBook, enforced server-side).
    const activeLoan = await db
        .collection('borrowRecords')
        .where('userId', '==', uid)
        .where('bookId', '==', bookId)
        .where('returned', '==', false)
        .limit(1)
        .get();
    if (activeLoan.empty) {
        throw new HttpsError('permission-denied', 'Borrow this eBook first before opening it.');
    }

    const bookSnap = await db.collection('books').doc(bookId).get();
    if (!bookSnap.exists) throw new HttpsError('not-found', 'Book not found.');
    const book = bookSnap.data() ?? {};

    const storagePath = book.ebookStoragePath as string | undefined;

    // Legacy Drive titles can't be per-user gated; signal the fallback.
    if (!storagePath) {
        const legacyUrl = book.ebookUrl as string | undefined;
        if (!legacyUrl) throw new HttpsError('not-found', 'No eBook file is available for this title.');
        return { kind: 'legacy-drive' as const, url: legacyUrl };
    }

    const expiresAt = Date.now() + SIGNED_URL_TTL_MS;
    try {
        const [url] = await getStorage()
            .bucket()
            .file(storagePath)
            .getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
        return { kind: 'signed' as const, url, expiresAt };
    } catch (err) {
        // Most common cause: the runtime service account lacks the
        // "Service Account Token Creator" role needed to sign URLs.
        logger.error('Failed to sign eBook URL', { bookId, storagePath, err });
        throw new HttpsError('internal', 'Unable to prepare this eBook right now.');
    }
});
