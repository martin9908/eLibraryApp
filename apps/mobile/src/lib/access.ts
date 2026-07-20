/**
 * Pure RBAC capability predicates (feature 002) — mirror of the web app's
 * `apps/web/src/lib/access.ts` so both platforms behave identically (FR-016).
 * UX convenience only; Firestore rules + Cloud Functions are authoritative.
 */
import type { LibrarianScope, Role } from '@/src/types/library';

type Target = { libraryId?: string; region?: string };

export function inScope(scope: LibrarianScope, libraryId?: string, region?: string): boolean {
    if (libraryId && scope.assignedLibraryIds?.includes(libraryId)) return true;
    if (region && scope.assignedRegion && scope.assignedRegion === region) return true;
    return false;
}

export function canManageInventory(role: Role, scope: LibrarianScope, target: Target): boolean {
    if (role === 'admin') return true;
    if (role === 'librarian') return inScope(scope, target.libraryId, target.region);
    return false;
}

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

export function canManageLibrarians(role: Role): boolean {
    return role === 'admin';
}

export function canAccessManageArea(role: Role): boolean {
    return role === 'librarian' || role === 'admin';
}
