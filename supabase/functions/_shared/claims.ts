// Claims helper — port of functions/src/rbac/claims.ts.
//
// Sets a user's role + scope authoritatively: writes the JWT app_metadata claim
// (the authz source of truth read by RLS — { role, libs, region }) via the
// admin API AND mirrors it onto public.users for querying/UI, in one logical
// operation. Only reachable through service-role Edge Functions; the client can
// never change its own role.
//
// status === 'suspended' clears the role claim so the user loses access (their
// token carries no role → jwt_role() is NULL → is_active() false → RLS denies),
// while the mirror row records the suspension.

import { type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Role } from './auth.ts';

export type AccountStatus = 'active' | 'suspended';

export type LibrarianScope = {
    assignedLibraryIds?: string[];
    assignedRegion?: string | null;
};

export async function setUserRole(
    supabase: SupabaseClient,
    uid: string,
    role: Role,
    scope: LibrarianScope = {},
    status: AccountStatus = 'active',
): Promise<void> {
    // Compact claim: role + (for librarians) assigned libs/region. Suspended
    // accounts get role:null so the token carries no privilege.
    const appMetadata: Record<string, unknown> = { role: status === 'suspended' ? null : role };
    if (status !== 'suspended' && role === 'librarian') {
        appMetadata.libs = scope.assignedLibraryIds?.length ? scope.assignedLibraryIds : [];
        appMetadata.region = scope.assignedRegion ?? null;
    } else {
        // Clear stale scope for non-librarians / suspended accounts.
        appMetadata.libs = [];
        appMetadata.region = null;
    }

    const { error: authErr } = await supabase.auth.admin.updateUserById(uid, {
        app_metadata: appMetadata,
    });
    if (authErr) throw new Error(`Failed to set claims: ${authErr.message}`);

    // Mirror role/status/scope into public.users.
    const { error: mirrorErr } = await supabase
        .from('users')
        .update({
            role,
            status,
            assigned_library_ids: role === 'librarian' ? scope.assignedLibraryIds ?? [] : [],
            assigned_region: role === 'librarian' ? scope.assignedRegion ?? null : null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', uid);
    if (mirrorErr) throw new Error(`Failed to mirror role: ${mirrorErr.message}`);
}

/** Count active admins — protects the last admin from demotion/suspension. */
export async function countActiveAdmins(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('status', 'active');
    if (error) throw new Error(`Failed to count admins: ${error.message}`);
    return count ?? 0;
}
