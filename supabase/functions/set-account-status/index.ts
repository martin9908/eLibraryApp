// set-account-status — port of functions/src/rbac/setAccountStatus.ts.
//
// Suspend/reactivate an account (FR-014). Admin may act on anyone (except
// suspending the last active admin); a librarian may act only on PATRONS within
// their assigned libraries. Suspending clears the role claim (via setUserRole)
// so the user's token carries no privilege and RLS denies them; reactivating
// restores the role. Audited.

import { corsHeaders, json } from '../_shared/cors.ts';
import {
    getCaller,
    HttpError,
    requireStaff,
    serviceClient,
    type Role,
} from '../_shared/auth.ts';
import { countActiveAdmins, setUserRole, type AccountStatus } from '../_shared/claims.ts';
import { writeAudit } from '../_shared/audit.ts';

type Input = { targetUid?: string; status?: AccountStatus };

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = serviceClient();
        const caller = await getCaller(req, supabase);
        requireStaff(caller);

        const { targetUid, status } = (await req.json().catch(() => ({}))) as Input;
        if (!targetUid) throw new HttpError(400, 'targetUid is required.');
        if (status !== 'active' && status !== 'suspended') {
            throw new HttpError(400, "status must be 'active' or 'suspended'.");
        }

        const { data: target, error: readErr } = await supabase
            .from('users')
            .select('role, home_library_id, assigned_library_ids, assigned_region')
            .eq('id', targetUid)
            .maybeSingle();
        if (readErr) throw new HttpError(500, 'Unable to load the target account.');
        if (!target) throw new HttpError(404, 'User not found.');

        const targetRole = (target.role as Role) ?? 'patron';

        // Librarian: only patrons whose home library is in the librarian's scope.
        if (caller.role === 'librarian') {
            const inScope = !!target.home_library_id && caller.libs.includes(target.home_library_id);
            if (targetRole !== 'patron' || !inScope) {
                throw new HttpError(403, 'You can only manage patrons in your assigned library.');
            }
        }

        // Last-admin protection: don't suspend the final active admin.
        if (status === 'suspended' && targetRole === 'admin' && (await countActiveAdmins(supabase)) <= 1) {
            throw new HttpError(409, 'Cannot suspend the last remaining administrator.');
        }

        await setUserRole(
            supabase,
            targetUid,
            targetRole,
            {
                assignedLibraryIds: (target.assigned_library_ids as string[] | null) ?? [],
                assignedRegion: (target.assigned_region as string | null) ?? null,
            },
            status,
        );

        await writeAudit(supabase, {
            actorUid: caller.uid,
            actorRole: caller.role as Role,
            action: status === 'suspended' ? 'account.suspend' : 'account.reactivate',
            targetType: 'user',
            targetId: targetUid,
            details: { targetRole },
        });

        return json({ ok: true, targetUid, status });
    } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error('set-account-status error', err);
        return json({ error: 'Unexpected error.' }, 500);
    }
});
