// update-patron — port of functions/src/rbac/updatePatron.ts.
//
// Update a patron's profile (never role/status/scope). Admin may edit any
// patron; a librarian only patrons in their assigned libraries. Whitelisted
// fields only: homeLibraryId, memberType. Audited.

import { corsHeaders, json } from '../_shared/cors.ts';
import { getCaller, HttpError, requireStaff, serviceClient, type Role } from '../_shared/auth.ts';
import { writeAudit } from '../_shared/audit.ts';

type Input = {
    targetUid?: string;
    changes?: { homeLibraryId?: string; memberType?: string };
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = serviceClient();
        const caller = await getCaller(req, supabase);
        requireStaff(caller);

        const { targetUid, changes } = (await req.json().catch(() => ({}))) as Input;
        if (!targetUid || !changes) throw new HttpError(400, 'targetUid and changes are required.');

        // Whitelist fields — never role/status/scope. Map to snake_case columns.
        const safe: Record<string, unknown> = {};
        if (changes.homeLibraryId !== undefined) safe.home_library_id = changes.homeLibraryId;
        if (changes.memberType !== undefined) safe.member_type = changes.memberType;
        if (Object.keys(safe).length === 0) {
            throw new HttpError(400, 'No permitted fields to update.');
        }

        const { data: target, error: readErr } = await supabase
            .from('users')
            .select('role, home_library_id')
            .eq('id', targetUid)
            .maybeSingle();
        if (readErr) throw new HttpError(500, 'Unable to load the target account.');
        if (!target) throw new HttpError(404, 'User not found.');
        if ((target.role as Role) !== 'patron') {
            throw new HttpError(403, 'This tool manages patron accounts only.');
        }

        if (caller.role === 'librarian') {
            const inScope = !!target.home_library_id && caller.libs.includes(target.home_library_id);
            if (!inScope) throw new HttpError(403, 'This patron is outside your assigned library.');
        }

        safe.updated_at = new Date().toISOString();
        const { error: updErr } = await supabase.from('users').update(safe).eq('id', targetUid);
        if (updErr) throw new HttpError(500, 'Unable to update this patron.');

        await writeAudit(supabase, {
            actorUid: caller.uid,
            actorRole: caller.role as Role,
            action: 'patron.update',
            targetType: 'user',
            targetId: targetUid,
            details: { changes: safe },
        });

        return json({ ok: true, targetUid });
    } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error('update-patron error', err);
        return json({ error: 'Unexpected error.' }, 500);
    }
});
