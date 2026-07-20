// assign-role — port of functions/src/rbac/assignRole.ts (+ claims.setUserRole).
//
// Admin-only: assign/revoke a user's role and (for librarians) library/region
// scope. Sets the JWT app_metadata claim (authz source of truth) + mirrors it
// onto public.users. Refuses to demote the LAST active admin (FR-012). Audited
// (FR-013). The client can never reach this path — role/status/scope are not
// client-writable under RLS; this service-role function is the only way.

import { corsHeaders, json } from '../_shared/cors.ts';
import { getCaller, HttpError, requireAdmin, serviceClient, type Role } from '../_shared/auth.ts';
import { countActiveAdmins, setUserRole } from '../_shared/claims.ts';
import { writeAudit } from '../_shared/audit.ts';

const ROLES: Role[] = ['patron', 'librarian', 'admin'];

type Input = {
    targetUid?: string;
    role?: Role;
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = serviceClient();
        const caller = await getCaller(req, supabase);
        requireAdmin(caller);

        const { targetUid, role, assignedLibraryIds, assignedRegion } =
            (await req.json().catch(() => ({}))) as Input;

        if (!targetUid) throw new HttpError(400, 'targetUid is required.');
        if (!role || !ROLES.includes(role)) {
            throw new HttpError(400, `role must be one of ${ROLES.join(', ')}.`);
        }
        if (role === 'librarian' && !assignedLibraryIds?.length && !assignedRegion) {
            throw new HttpError(400, 'A librarian needs at least one assigned library or a region.');
        }

        // Read current role for last-admin protection + audit delta.
        const { data: current } = await supabase
            .from('users')
            .select('role')
            .eq('id', targetUid)
            .maybeSingle();

        const demotingAnAdmin = current?.role === 'admin' && role !== 'admin';
        if (demotingAnAdmin && (await countActiveAdmins(supabase)) <= 1) {
            throw new HttpError(409, 'Cannot demote the last remaining administrator.');
        }

        await setUserRole(
            supabase,
            targetUid,
            role,
            { assignedLibraryIds, assignedRegion },
            'active',
        );

        await writeAudit(supabase, {
            actorUid: caller.uid,
            actorRole: 'admin',
            action: current?.role && current.role !== role ? 'role.assign' : 'role.update',
            targetType: 'user',
            targetId: targetUid,
            details: {
                from: current?.role ?? null,
                to: role,
                assignedLibraryIds: assignedLibraryIds ?? [],
                assignedRegion: assignedRegion ?? null,
            },
        });

        return json({ ok: true, targetUid, role });
    } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error('assign-role error', err);
        return json({ error: 'Unexpected error.' }, 500);
    }
});
