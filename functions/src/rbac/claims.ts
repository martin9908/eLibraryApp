import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/** RBAC roles (mirror of @elibrary/types Role; functions has no workspace dep). */
export type Role = 'patron' | 'librarian' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export type LibrarianScope = {
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/**
 * Set a user's role + scope authoritatively: writes the Auth custom claim (the
 * authz source of truth, carried in the ID token) AND mirrors it onto
 * users/{uid} for querying/UI — in one logical operation. Admin-SDK only; the
 * client can never call this path (see security rules).
 *
 * `status: 'suspended'` clears the role claim so security rules deny the user
 * (they retain no role in their token) while the mirror records the suspension.
 */
export async function setUserRole(
    uid: string,
    role: Role,
    scope: LibrarianScope = {},
    status: AccountStatus = 'active',
): Promise<void> {
    const auth = getAuth();
    const db = getFirestore();

    // Compact claim: role + (for librarians) assigned libs/region.
    const claims: Record<string, unknown> =
        status === 'suspended' ? { role: null } : { role };
    if (status !== 'suspended' && role === 'librarian') {
        if (scope.assignedLibraryIds?.length) claims.libs = scope.assignedLibraryIds;
        if (scope.assignedRegion) claims.region = scope.assignedRegion;
    }
    await auth.setCustomUserClaims(uid, claims);

    const mirror: Record<string, unknown> = {
        role,
        status,
        updatedAt: Timestamp.now(),
    };
    // Only librarians carry scope; clear it otherwise to avoid stale grants.
    mirror.assignedLibraryIds = role === 'librarian' ? scope.assignedLibraryIds ?? [] : [];
    mirror.assignedRegion = role === 'librarian' ? scope.assignedRegion ?? null : null;

    await db.collection('users').doc(uid).set(mirror, { merge: true });
}

/** Count active admins — used to protect the last admin from demotion. */
export async function countActiveAdmins(): Promise<number> {
    const db = getFirestore();
    const snap = await db
        .collection('users')
        .where('role', '==', 'admin')
        .where('status', '==', 'active')
        .get();
    return snap.size;
}

/** Read a user's current mirrored role/status (from the users doc). */
export async function getUserRoleDoc(
    uid: string,
): Promise<{ role: Role; status: AccountStatus; assignedLibraryIds: string[]; assignedRegion: string | null } | null> {
    const db = getFirestore();
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return null;
    const d = snap.data() ?? {};
    return {
        role: (d.role as Role) ?? 'patron',
        status: (d.status as AccountStatus) ?? 'active',
        assignedLibraryIds: (d.assignedLibraryIds as string[]) ?? [],
        assignedRegion: (d.assignedRegion as string | null) ?? null,
    };
}
