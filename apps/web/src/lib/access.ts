/**
 * Pure RBAC capability predicates (feature 002). The UI uses these to show only
 * permitted surfaces — but they are NOT the security boundary. Firestore rules
 * + callable Cloud Functions are authoritative; these mirror that logic for UX.
 *
 * Kept in sync with mobile `src/lib/access.ts` (identical behavior — FR-016).
 */
import type { LibrarianScope, Role } from '@elibrary/types';

type Target = { libraryId?: string; region?: string };

/** admin ⇒ any scope; librarian ⇒ only within assigned libraries/region. */
export function inScope(scope: LibrarianScope, libraryId?: string, region?: string): boolean {
    if (libraryId && scope.assignedLibraryIds?.includes(libraryId)) return true;
    if (region && scope.assignedRegion && scope.assignedRegion === region) return true;
    return false;
}

/** Librarian (in scope) or admin may manage inventory for the target's library. */
export function canManageInventory(role: Role, scope: LibrarianScope, target: Target): boolean {
    if (role === 'admin') return true;
    if (role === 'librarian') return inScope(scope, target.libraryId, target.region);
    return false;
}

/** Librarian (in scope) or admin may manage a patron in the given library/region. */
export function canManagePatrons(
    role: Role,
    scope: LibrarianScope,
    patronLibraryId?: string,
    patronRegion?: string,
): boolean {
    if (role === 'admin') return true;
    if (role === 'librarian') return inScope(scope, patronLibraryId, patronRegion);
    return false;
}

/** Only admins may assign/revoke the librarian/admin role and set scope. */
export function canManageLibrarians(role: Role): boolean {
    return role === 'admin';
}

/** Librarian or admin may enter the management area at all. */
export function canAccessManageArea(role: Role): boolean {
    return role === 'librarian' || role === 'admin';
}
