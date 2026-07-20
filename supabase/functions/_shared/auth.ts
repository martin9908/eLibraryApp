// Auth / authz helpers shared by every Edge Function.
//
// Port of the `request.auth` / `request.auth.token.role` gates from the Firebase
// callables. Each function runs with the SERVICE-ROLE key (so it bypasses RLS to
// perform privileged writes) but must still authenticate the *caller* from their
// JWT and check their role/scope claims — exactly like the callables did.
//
// The authz source of truth is the JWT's `app_metadata` claim, mirroring what
// RLS reads (see supabase/migrations/0002_rls.sql): { role, libs, region }.

import {
    createClient,
    type SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';

export type Role = 'patron' | 'librarian' | 'admin';

export type Caller = {
    uid: string;
    role: Role | null;
    libs: string[];
    region: string | null;
    /** Raw app_metadata for anything not surfaced above. */
    appMetadata: Record<string, unknown>;
};

/** A service-role client — bypasses RLS. Use for all privileged reads/writes. */
export function serviceClient(): SupabaseClient {
    return createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );
}

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/**
 * Resolve the caller from the Authorization: Bearer <jwt> header. We verify the
 * token with the service client's auth API (getUser) rather than trusting an
 * unsigned decode, then read the role/scope from app_metadata.
 */
export async function getCaller(
    req: Request,
    supabase: SupabaseClient,
): Promise<Caller> {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new HttpError(401, 'Sign in required.');

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, 'Sign in required.');

    const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
    const role = (meta.role as Role | undefined) ?? null;
    const libs = Array.isArray(meta.libs) ? (meta.libs as string[]) : [];
    const region = (meta.region as string | undefined) ?? null;

    return { uid: data.user.id, role, libs, region, appMetadata: meta };
}

/** admin only. */
export function requireAdmin(caller: Caller): void {
    if (caller.role !== 'admin') {
        throw new HttpError(403, 'Only an administrator can perform this action.');
    }
}

/** admin or librarian. */
export function requireStaff(caller: Caller): void {
    if (caller.role !== 'admin' && caller.role !== 'librarian') {
        throw new HttpError(403, 'Not permitted.');
    }
}

/**
 * Does the caller's token scope cover this library/region? admin ⇒ always;
 * librarian ⇒ library in their `libs` OR region matches their `region`.
 * Mirrors tokenInScope() from functions/src/rbac/deleteBook.ts.
 */
export function inScope(
    caller: Caller,
    libraryId?: string | null,
    region?: string | null,
): boolean {
    if (caller.role === 'admin') return true;
    if (caller.role !== 'librarian') return false;
    return (
        (!!libraryId && caller.libs.includes(libraryId)) ||
        (!!region && !!caller.region && region === caller.region)
    );
}
