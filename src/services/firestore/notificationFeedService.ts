import {
    collection,
    doc,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import type { AppNotification, NotificationCategory } from '@/src/types/library';

const NOTIFICATIONS_COLLECTION = 'notifications';

function mapNotification(id: string, raw: Record<string, unknown>): AppNotification {
    return {
        id,
        userId: (raw.userId as string) ?? '',
        category: (raw.category as NotificationCategory) ?? 'general',
        title: (raw.title as string) ?? '',
        body: raw.body as string | undefined,
        read: Boolean(raw.read),
        createdAt: raw.createdAt as AppNotification['createdAt'],
    };
}

/** Recent notifications for a user, newest first, capped by `max`. */
export async function getRecentNotifications(userId: string, max = 5): Promise<AppNotification[]> {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(max),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapNotification(d.id, d.data() as Record<string, unknown>));
}

/** Count of unread notifications for the unread badge. */
export async function getUnreadCount(userId: string): Promise<number> {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false),
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { read: true });
}

/** Marks every unread notification for the user as read; persists. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
}
