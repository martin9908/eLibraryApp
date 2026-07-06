import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { countActiveAdmins, getUserRoleDoc, setUserRole, type Role } from './claims';
import { writeAudit } from './audit';

const ROLES: Role[] = ['patron', 'librarian', 'admin'];

type AssignRoleInput = {
    targetUid?: string;
    role?: Role;
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/**
 * Admin-only: assign/revoke a user's role and (for librarians) library/region
 * scope. Sets the custom claim + mirrors the users doc via setUserRole. Refuses
 * to demote/remove the LAST active admin (FR-012). Audited (FR-013).
 *
 * The client can never do this directly — role/status/scope are not
 * client-writable in security rules; this Admin-SDK callable is the only path.
 */
export const assignRole = onCall(async (request) => {
    // 1) Caller must be an authenticated, active admin.
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    if (request.auth.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only an administrator can assign roles.');
    }

    // 2) Validate input.
    const { targetUid, role, assignedLibraryIds, assignedRegion } = (request.data ?? {}) as AssignRoleInput;
    if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.');
    if (!role || !ROLES.includes(role)) {
        throw new HttpsError('invalid-argument', `role must be one of ${ROLES.join(', ')}.`);
    }
    if (role === 'librarian' && !assignedLibraryIds?.length && !assignedRegion) {
        throw new HttpsError('invalid-argument', 'A librarian needs at least one assigned library or a region.');
    }

    // 3) Last-admin protection: don't demote/remove the final active admin.
    const current = await getUserRoleDoc(targetUid);
    const demotingAnAdmin = current?.role === 'admin' && role !== 'admin';
    if (demotingAnAdmin && (await countActiveAdmins()) <= 1) {
        throw new HttpsError('failed-precondition', 'Cannot demote the last remaining administrator.');
    }

    // 4) Apply authoritatively (claim + mirror), then audit.
    await setUserRole(
        targetUid,
        role,
        { assignedLibraryIds, assignedRegion },
        'active',
    );
    await writeAudit({
        actorUid: request.auth.uid,
        actorRole: 'admin',
        action: current?.role && current.role !== role ? 'role.assign' : 'role.update',
        targetType: 'user',
        targetId: targetUid,
        details: { from: current?.role ?? null, to: role, assignedLibraryIds: assignedLibraryIds ?? [], assignedRegion: assignedRegion ?? null },
    });

    return { ok: true, targetUid, role };
});
