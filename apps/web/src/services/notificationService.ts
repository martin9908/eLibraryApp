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
import type { Notification, NotificationCategory } from '@elibrary/types';

const NOTIFICATIONS = 'notifications';

function mapNotification(id: string, raw: Record<string, unknown>): Notification {
    return {
        id,
        userId: (raw.userId as string) ?? '',
        category: (raw.category as NotificationCategory) ?? 'general',
        title: (raw.title as string) ?? '',
        body: raw.body as string | undefined,
        read: Boolean(raw.read),
        createdAt: raw.createdAt as Notification['createdAt'],
    };
}

/** Recent notifications for a user, newest first, capped by `max` (FR-012). */
export async function getRecentNotifications(userId: string, max = 5): Promise<Notification[]> {
    const q = query(
        collection(db, NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapNotification(d.id, d.data() as Record<string, unknown>));
}

/** Count of unread notifications for the unread badge (FR-011). */
export async function getUnreadCount(userId: string): Promise<number> {
    const q = query(
        collection(db, NOTIFICATIONS),
        where('userId', '==', userId),
        where('read', '==', false),
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, NOTIFICATIONS, notificationId), { read: true });
}

/** Marks every unread notification for the user as read; persists (FR-010). */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    const q = query(
        collection(db, NOTIFICATIONS),
        where('userId', '==', userId),
        where('read', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
}
