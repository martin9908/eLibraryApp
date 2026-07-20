// get-ebook-url — port of functions/src/ebooks/getEbookUrl.ts.
//
// Server-side loan gate: issues a short-lived signed URL to a borrowed eBook's
// bytes instead of exposing a permanent bearer URL. Trust nothing from the
// client except the verified JWT; re-check the active loan here because RLS /
// Storage policies can't express "issue bytes only to an active borrower".
//
// Storage-hosted titles → signed URL to books.ebook_storage_path in the private
// 'ebooks' bucket. Legacy Drive-only titles (no storage path) → fall back to the
// ungated legacy ebook_url until migration.

import { corsHeaders, json } from '../_shared/cors.ts';
import { getCaller, HttpError, serviceClient } from '../_shared/auth.ts';

// Signed URLs live this long (seconds). Short enough that a leaked link dies fast.
const SIGNED_URL_TTL_SECONDS = 10 * 60;

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = serviceClient();
        const caller = await getCaller(req, supabase);

        const { bookId } = (await req.json().catch(() => ({}))) as { bookId?: string };
        if (!bookId) throw new HttpError(400, 'bookId is required.');

        // Active-loan check (mirror of client canUserAccessBook, enforced here).
        const { data: loan, error: loanErr } = await supabase
            .from('borrow_records')
            .select('id')
            .eq('user_id', caller.uid)
            .eq('book_id', bookId)
            .eq('returned', false)
            .limit(1)
            .maybeSingle();
        if (loanErr) throw new HttpError(500, 'Unable to verify your loan right now.');
        if (!loan) throw new HttpError(403, 'Borrow this eBook first before opening it.');

        const { data: book, error: bookErr } = await supabase
            .from('books')
            .select('ebook_storage_path, ebook_url')
            .eq('id', bookId)
            .maybeSingle();
        if (bookErr) throw new HttpError(500, 'Unable to load this title right now.');
        if (!book) throw new HttpError(404, 'Book not found.');

        const storagePath = book.ebook_storage_path as string | null;

        // Legacy Drive titles can't be per-user gated; signal the fallback.
        if (!storagePath) {
            const legacyUrl = book.ebook_url as string | null;
            if (!legacyUrl) throw new HttpError(404, 'No eBook file is available for this title.');
            return json({ url: legacyUrl, kind: 'legacy-drive' });
        }

        const { data: signed, error: signErr } = await supabase.storage
            .from('ebooks')
            .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
        if (signErr || !signed?.signedUrl) {
            console.error('Failed to sign eBook URL', bookId, storagePath, signErr?.message);
            throw new HttpError(500, 'Unable to prepare this eBook right now.');
        }

        return json({
            url: signed.signedUrl,
            kind: 'signed',
            expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        });
    } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error('get-ebook-url error', err);
        return json({ error: 'Unexpected error.' }, 500);
    }
});
