import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { countActiveAdmins, setUserRole, type AccountStatus, type Role } from './claims';
import { writeAudit } from './audit';

type Input = { targetUid?: string; status?: AccountStatus };

/**
 * Suspend/reactivate an account (FR-014). Admin may act on anyone (except
 * suspending the last active admin); a librarian may act only on **patrons
 * within their assigned libraries**. Suspending clears the role claim (via
 * setUserRole) so security rules deny the user. Audited.
 */
export const setAccountStatus = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const callerRole = request.auth.token.role as Role | undefined;
    if (callerRole !== 'admin' && callerRole !== 'librarian') {
        throw new HttpsError('permission-denied', 'Not permitted.');
    }

    const { targetUid, status } = (request.data ?? {}) as Input;
    if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.');
    if (status !== 'active' && status !== 'suspended') {
        throw new HttpsError('invalid-argument', "status must be 'active' or 'suspended'.");
    }

    const db = getFirestore();
    const snap = await db.collection('users').doc(targetUid).get();
    if (!snap.exists) throw new HttpsError('not-found', 'User not found.');
    const target = snap.data() ?? {};
    const targetRole = (target.role as Role) ?? 'patron';

    // Librarian: only patrons whose home library is in the librarian's scope.
    if (callerRole === 'librarian') {
        const libs = (request.auth.token.libs as string[] | undefined) ?? [];
        const inScope = !!target.homeLibraryId && libs.includes(target.homeLibraryId as string);
        if (targetRole !== 'patron' || !inScope) {
            throw new HttpsError('permission-denied', 'You can only manage patrons in your assigned library.');
        }
    }

    // Last-admin protection: don't suspend the final active admin.
    if (status === 'suspended' && targetRole === 'admin' && (await countActiveAdmins()) <= 1) {
        throw new HttpsError('failed-precondition', 'Cannot suspend the last remaining administrator.');
    }

    await setUserRole(
        targetUid,
        targetRole,
        {
            assignedLibraryIds: (target.assignedLibraryIds as string[] | undefined) ?? [],
            assignedRegion: (target.assignedRegion as string | undefined) ?? undefined,
        },
        status,
    );
    await writeAudit({
        actorUid: request.auth.uid,
        actorRole: callerRole,
        action: status === 'suspended' ? 'account.suspend' : 'account.reactivate',
        targetType: 'user',
        targetId: targetUid,
        details: { targetRole },
    });

    return { ok: true, targetUid, status };
});
