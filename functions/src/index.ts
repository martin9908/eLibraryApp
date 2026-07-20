import * as admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = getFirestore();

// ─── RBAC (feature 002) ──────────────────────────────────────────────────────
// Default new users to Patron (FR-002). Privileged, Admin-SDK-only mutations —
// the client can never change a role (enforced by security rules).
export { onUserCreate } from './rbac/onUserCreate';
export { assignRole } from './rbac/assignRole';         // admin: assign/revoke role + scope (US3)
export { deleteBook } from './rbac/deleteBook';          // librarian/admin: scoped delete w/ active-loan guard (US2)
export { setAccountStatus } from './rbac/setAccountStatus'; // suspend/reactivate; scoped for librarians (US2)
export { updatePatron } from './rbac/updatePatron';      // scoped patron-profile edits (US2)

// ─── Secure eBook access ─────────────────────────────────────────────────────
// Server-side loan gate: issues short-lived signed URLs to borrowed eBook bytes
// instead of exposing permanent bearer URLs.
export { getEbookUrl } from './ebooks/getEbookUrl';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the Expo push token for a user (stored in users/{uid}.expoPushToken). */
async function getPushToken(userId: string): Promise<string | null> {
    const snap = await db.collection('users').doc(userId).get();
    if (!snap.exists) return null;
    const token = snap.data()?.expoPushToken as string | null | undefined;
    return token ?? null;
}

/**
 * Send a notification via the Expo Push Notifications HTTP API.
 * We call Expo directly so no FCM server key is needed for Expo-managed apps.
 */
async function sendExpoPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
): Promise<void> {
    const message = {
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: data ?? {},
    };
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
    if (!response.ok) {
        functions.logger.error('Expo push send failed', { status: response.status, token });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Function 1 — Daily due-date reminders
// Runs every day at 08:00 Manila time (UTC+8 → 00:00 UTC).
// ─────────────────────────────────────────────────────────────────────────────
export const sendDueDateReminders = functions.scheduler
    .onSchedule('0 0 * * *', async () => {
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setUTCHours(0, 0, 0, 0);
        tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);

        const snap = await db
            .collection('borrowRecords')
            .where('returned', '==', false)
            .where('dueDate', '>=', Timestamp.fromDate(tomorrowStart))
            .where('dueDate', '<', Timestamp.fromDate(tomorrowEnd))
            .get();

        if (snap.empty) {
            functions.logger.info('No due-date reminders to send today.');
            return;
        }

        const sends = snap.docs.map(async (docSnap) => {
            const record = docSnap.data();
            const userId: string = record.userId;
            const bookId: string = record.bookId;

            const [token, bookSnap] = await Promise.all([
                getPushToken(userId),
                db.collection('books').doc(bookId).get(),
            ]);

            if (!token) return;

            const title = bookSnap.data()?.title as string | undefined;

            await sendExpoPushNotification(
                token,
                'Book due tomorrow 📚',
                title
                    ? `"${title}" is due tomorrow. Return it on time to avoid penalties.`
                    : 'One of your borrowed books is due tomorrow.',
                { screen: 'BorrowHistory' },
            );
        });

        await Promise.allSettled(sends);
        functions.logger.info(`Sent ${snap.size} due-date reminder(s).`);
    });

// ─────────────────────────────────────────────────────────────────────────────
// Function 2 — Availability alert
// Fires when a book's availableCopies transitions from 0 to > 0.
// Notifies users who previously returned this book (likely interested).
// ─────────────────────────────────────────────────────────────────────────────
export const onBookAvailabilityChange = functions.firestore
    .onDocumentUpdated('books/{bookId}', async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();

        if (!before || !after) return;

        const wasUnavailable = (before.availableCopies as number) === 0;
        const isNowAvailable = (after.availableCopies as number) > 0;

        if (!wasUnavailable || !isNowAvailable) return;

        const bookId = event.params.bookId;
        const bookTitle = after.title as string;

        // Find users who borrowed (and returned) this book — they're likely interested.
        const previousBorrowersSnap = await db
            .collection('borrowRecords')
            .where('bookId', '==', bookId)
            .where('returned', '==', true)
            .get();

        if (previousBorrowersSnap.empty) return;

        const uniqueUserIds = [
            ...new Set(previousBorrowersSnap.docs.map((d) => d.data().userId as string)),
        ];

        const sends = uniqueUserIds.map(async (userId) => {
            const token = await getPushToken(userId);
            if (!token) return;
            await sendExpoPushNotification(
                token,
                'Book now available! 🎉',
                `"${bookTitle}" is back in stock. Borrow it before it runs out.`,
                { screen: 'BookDetail', bookId },
            );
        });

        await Promise.allSettled(sends);
        functions.logger.info(`Sent availability alerts for "${bookTitle}" to ${uniqueUserIds.length} user(s).`);
    });
