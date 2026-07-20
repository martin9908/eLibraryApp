// send-due-reminders — port of functions/src/index.ts sendDueDateReminders.
//
// The pg_cron target (0 0 * * * == 08:00 Manila). Invoked server-side by
// public.invoke_edge_function with the service-role key as bearer — NOT by an
// end user, so we authorize by matching that key rather than a user JWT.
//
// Queries loans due TOMORROW (UTC day window) that are still unreturned, writes
// a 'dueReminder' notification row for each borrower, and sends the Expo push.

import { json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/auth.ts';
import { sendExpoPushBatch, type ExpoMessage } from '../_shared/expoPush.ts';

function assertServiceCaller(req: Request): void {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token || token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        throw new Error('forbidden');
    }
}

Deno.serve(async (req) => {
    try {
        assertServiceCaller(req);
    } catch {
        return json({ error: 'Forbidden.' }, 403);
    }

    const supabase = serviceClient();

    // Tomorrow's UTC day window [start, end).
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const { data: records, error } = await supabase
        .from('borrow_records')
        .select('id, user_id, book_id')
        .eq('returned', false)
        .gte('due_date', start.toISOString())
        .lt('due_date', end.toISOString());

    if (error) {
        console.error('send-due-reminders query failed', error.message);
        return json({ error: 'Query failed.' }, 500);
    }
    if (!records || records.length === 0) {
        return json({ ok: true, sent: 0, message: 'No due-date reminders to send today.' });
    }

    // Resolve book titles and borrower push tokens in bulk.
    const bookIds = [...new Set(records.map((r) => r.book_id))];
    const userIds = [...new Set(records.map((r) => r.user_id))];

    const [{ data: books }, { data: users }] = await Promise.all([
        supabase.from('books').select('id, title').in('id', bookIds),
        supabase.from('users').select('id, expo_push_token').in('id', userIds),
    ]);

    const titleById = new Map((books ?? []).map((b) => [b.id, b.title as string]));
    const tokenById = new Map(
        (users ?? []).map((u) => [u.id, u.expo_push_token as string | null]),
    );

    const notifications: Record<string, unknown>[] = [];
    const pushes: ExpoMessage[] = [];

    for (const rec of records) {
        const title = titleById.get(rec.book_id);
        const body = title
            ? `"${title}" is due tomorrow. Return it on time to avoid penalties.`
            : 'One of your borrowed books is due tomorrow.';

        notifications.push({
            id: crypto.randomUUID(),
            user_id: rec.user_id,
            category: 'dueReminder',
            title: 'Book due tomorrow',
            body,
            read: false,
        });

        const token = tokenById.get(rec.user_id);
        if (token) {
            pushes.push({
                to: token,
                title: 'Book due tomorrow 📚',
                body,
                data: { screen: 'BorrowHistory' },
            });
        }
    }

    if (notifications.length > 0) {
        const { error: notifErr } = await supabase.from('notifications').insert(notifications);
        if (notifErr) console.error('send-due-reminders notif insert failed', notifErr.message);
    }

    const sent = await sendExpoPushBatch(pushes);
    return json({ ok: true, reminders: records.length, pushed: sent });
});
