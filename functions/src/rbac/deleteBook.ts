import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { writeAudit } from './audit';
import type { Role } from './claims';

type DeleteBookInput = { bookId?: string };

/** Does the caller's token scope cover this library/region? (admin ⇒ always) */
function tokenInScope(token: Record<string, unknown>, libraryId?: string, region?: string): boolean {
    if (token.role === 'admin') return true;
    if (token.role !== 'librarian') return false;
    const libs = (token.libs as string[] | undefined) ?? [];
    const tokRegion = token.region as string | undefined;
    return (!!libraryId && libs.includes(libraryId)) || (!!region && !!tokRegion && region === tokRegion);
}

/**
 * Delete an inventory item, enforcing role/scope AND the multi-doc invariant
 * that a title with active loans cannot be deleted (FR-015). Routed through a
 * callable because rules can't check "no active loans" cross-collection.
 */
export const deleteBook = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const role = request.auth.token.role as Role | undefined;
    if (role !== 'admin' && role !== 'librarian') {
        throw new HttpsError('permission-denied', 'Only librarians or admins can remove inventory.');
    }

    const { bookId } = (request.data ?? {}) as DeleteBookInput;
    if (!bookId) throw new HttpsError('invalid-argument', 'bookId is required.');

    const db = getFirestore();
    const bookRef = db.collection('books').doc(bookId);
    const bookSnap = await bookRef.get();
    if (!bookSnap.exists) throw new HttpsError('not-found', 'Book not found.');

    const book = bookSnap.data() ?? {};
    if (!tokenInScope(request.auth.token, book.libraryId as string | undefined, book.region as string | undefined)) {
        throw new HttpsError('permission-denied', 'This title is outside your assigned library or region.');
    }

    // Invariant: refuse if there are active (unreturned) loans for this title.
    const activeLoans = await db
        .collection('borrowRecords')
        .where('bookId', '==', bookId)
        .where('returned', '==', false)
        .limit(1)
        .get();
    if (!activeLoans.empty) {
        throw new HttpsError('failed-precondition', 'This title has active loans and cannot be removed until they are returned.');
    }

    await bookRef.delete();
    await writeAudit({
        actorUid: request.auth.uid,
        actorRole: role,
        action: 'book.delete',
        targetType: 'book',
        targetId: bookId,
        details: { title: book.title ?? null, libraryId: book.libraryId ?? null },
    });

    return { ok: true, bookId };
});
