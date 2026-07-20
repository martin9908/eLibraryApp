import { supabase } from '@/src/lib/supabase';
import { rowToNotification } from '@/src/lib/supabaseMap';
import type { NotificationRow } from '@/src/lib/supabaseMap';
import type { Notification } from '@elibrary/types';

const NOTIFICATIONS = 'notifications';

/** Recent notifications for a user, newest first, capped by `max` (FR-012). */
export async function getRecentNotifications(userId: string, max = 5): Promise<Notification[]> {
    const { data, error } = await supabase
        .from(NOTIFICATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(max);
    if (error) throw error;
    return (data as NotificationRow[]).map(rowToNotification);
}

/** Count of unread notifications for the unread badge (FR-011). */
export async function getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from(NOTIFICATIONS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (error) throw error;
    return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from(NOTIFICATIONS)
        .update({ read: true })
        .eq('id', notificationId);
    if (error) throw error;
}

/** Marks every unread notification for the user as read; persists (FR-010). */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from(NOTIFICATIONS)
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    if (error) throw error;
}
