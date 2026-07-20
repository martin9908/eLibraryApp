// delete-book — port of functions/src/rbac/deleteBook.ts.
//
// Delete an inventory item, enforcing role/scope AND the cross-table invariant
// that a title with active (unreturned) loans cannot be deleted (FR-015).
// Routed through an Edge Function because RLS can't check "no active loans"
// across tables the way this needs to before the delete.

import { corsHeaders, json } from '../_shared/cors.ts';
import { getCaller, HttpError, inScope, requireStaff, serviceClient, type Role } from '../_shared/auth.ts';
import { writeAudit } from '../_shared/audit.ts';

type Input = { bookId?: string };

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = serviceClient();
        const caller = await getCaller(req, supabase);
        requireStaff(caller);

        const { bookId } = (await req.json().catch(() => ({}))) as Input;
        if (!bookId) throw new HttpError(400, 'bookId is required.');

        const { data: book, error: bookErr } = await supabase
            .from('books')
            .select('title, library_id, region')
            .eq('id', bookId)
            .maybeSingle();
        if (bookErr) throw new HttpError(500, 'Unable to load this title.');
        if (!book) throw new HttpError(404, 'Book not found.');

        if (!inScope(caller, book.library_id, book.region)) {
            throw new HttpError(403, 'This title is outside your assigned library or region.');
        }

        // Invariant: refuse if there are active (unreturned) loans for this title.
        const { data: activeLoan, error: loanErr } = await supabase
            .from('borrow_records')
            .select('id')
            .eq('book_id', bookId)
            .eq('returned', false)
            .limit(1)
            .maybeSingle();
        if (loanErr) throw new HttpError(500, 'Unable to verify active loans.');
        if (activeLoan) {
            throw new HttpError(
                409,
                'This title has active loans and cannot be removed until they are returned.',
            );
        }

        const { error: delErr } = await supabase.from('books').delete().eq('id', bookId);
        if (delErr) throw new HttpError(500, 'Unable to delete this title.');

        await writeAudit(supabase, {
            actorUid: caller.uid,
            actorRole: caller.role as Role,
            action: 'book.delete',
            targetType: 'book',
            targetId: bookId,
            details: { title: book.title ?? null, libraryId: book.library_id ?? null },
        });

        return json({ ok: true, bookId });
    } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error('delete-book error', err);
        return json({ error: 'Unexpected error.' }, 500);
    }
});
