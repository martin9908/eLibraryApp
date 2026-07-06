import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { writeAudit } from './audit';
import type { Role } from './claims';

type Input = {
    targetUid?: string;
    changes?: { homeLibraryId?: string; memberType?: string };
};

const ALLOWED = ['homeLibraryId', 'memberType'] as const;

/**
 * Update a patron's profile (never role/status/scope). Admin may edit any
 * patron; a librarian only patrons in their assigned libraries. Audited when
 * performed by someone other than the account owner.
 */
export const updatePatron = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const callerRole = request.auth.token.role as Role | undefined;
    if (callerRole !== 'admin' && callerRole !== 'librarian') {
        throw new HttpsError('permission-denied', 'Not permitted.');
    }

    const { targetUid, changes } = (request.data ?? {}) as Input;
    if (!targetUid || !changes) throw new HttpsError('invalid-argument', 'targetUid and changes are required.');

    // Whitelist fields — never role/status/scope.
    const safe: Record<string, unknown> = {};
    for (const k of ALLOWED) {
        if (changes[k] !== undefined) safe[k] = changes[k];
    }
    if (Object.keys(safe).length === 0) {
        throw new HttpsError('invalid-argument', 'No permitted fields to update.');
    }

    const db = getFirestore();
    const ref = db.collection('users').doc(targetUid);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError('not-found', 'User not found.');
    const target = snap.data() ?? {};
    if ((target.role as Role) !== 'patron') {
        throw new HttpsError('permission-denied', 'This tool manages patron accounts only.');
    }

    if (callerRole === 'librarian') {
        const libs = (request.auth.token.libs as string[] | undefined) ?? [];
        const inScope = !!target.homeLibraryId && libs.includes(target.homeLibraryId as string);
        if (!inScope) throw new HttpsError('permission-denied', 'This patron is outside your assigned library.');
    }

    safe.updatedAt = Timestamp.now();
    await ref.set(safe, { merge: true });
    await writeAudit({
        actorUid: request.auth.uid,
        actorRole: callerRole,
        action: 'patron.update',
        targetType: 'user',
        targetId: targetUid,
        details: { changes: safe },
    });

    return { ok: true, targetUid };
});
