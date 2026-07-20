// notify-availability — Expo push half of onBookAvailabilityChange
// (functions/src/index.ts). The in-app notification rows are written directly by
// the AFTER UPDATE trigger on public.books (handle_book_availability); this
// function only fans the Expo push out to the same audience — distinct PAST
// borrowers (returned = true) of the newly-available title.
//
// Invoked server-side by public.invoke_edge_function with the service-role key
// as bearer, so we authorize by matching that key rather than a user JWT.

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

    const { bookId } = (await req.json().catch(() => ({}))) as { bookId?: string };
    if (!bookId) return json({ error: 'bookId is required.' }, 400);

    const supabase = serviceClient();

    const { data: book } = await supabase
        .from('books')
        .select('title')
        .eq('id', bookId)
        .maybeSingle();
    const bookTitle = (book?.title as string | undefined) ?? 'A title you borrowed';

    // Distinct past borrowers (returned = true) — likely interested.
    const { data: records, error } = await supabase
        .from('borrow_records')
        .select('user_id')
        .eq('book_id', bookId)
        .eq('returned', true);
    if (error) {
        console.error('notify-availability query failed', error.message);
        return json({ error: 'Query failed.' }, 500);
    }

    const userIds = [...new Set((records ?? []).map((r) => r.user_id))];
    if (userIds.length === 0) return json({ ok: true, pushed: 0 });

    const { data: users } = await supabase
        .from('users')
        .select('id, expo_push_token')
        .in('id', userIds);

    const pushes: ExpoMessage[] = (users ?? [])
        .filter((u) => !!u.expo_push_token)
        .map((u) => ({
            to: u.expo_push_token as string,
            title: 'Book now available! 🎉',
            body: `"${bookTitle}" is back in stock. Borrow it before it runs out.`,
            data: { screen: 'BookDetail', bookId },
        }));

    const sent = await sendExpoPushBatch(pushes);
    return json({ ok: true, audience: userIds.length, pushed: sent });
});
