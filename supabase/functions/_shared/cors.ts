// Shared CORS headers for browser-invoked Edge Functions. The web app calls
// these via supabase-js `functions.invoke`, which issues a preflight OPTIONS.
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** JSON response helper that always carries the CORS headers. */
export function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
