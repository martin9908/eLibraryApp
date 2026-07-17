# Contract: UI Access (role → capability → surface), web + mobile

The client **reflects** the role read from the ID token (`getIdTokenResult`); it is never
the security boundary (that is rules + functions). Web and mobile MUST behave identically
(FR-016) via shared types (`@elibrary/types`) and a per-app `lib/access.ts` helper.

## Shared capability helper (both apps)

```ts
// lib/access.ts — pure, no I/O
type Scope = { assignedLibraryIds?: string[]; assignedRegion?: string };
canManageInventory(role: Role, scope: Scope, target: { libraryId: string; region?: string }): boolean
canManagePatrons(role: Role, scope: Scope, patronLibraryId?: string, patronRegion?: string): boolean
canManageLibrarians(role: Role): boolean   // admin only
canAccessManageArea(role: Role): boolean    // librarian or admin
inScope(scope: Scope, libraryId?: string, region?: string): boolean
```

`admin` ⇒ all true (nationwide). `librarian` ⇒ true only within scope. `patron` ⇒ all
management predicates false.

## Auth context extension (both apps)

`AuthContext` exposes `{ user, role, scope, status, initialising, refreshClaims() }` by
reading `getIdTokenResult()`. `refreshClaims()` forces a token refresh after a role change
(research R3).

## Surface matrix

| Surface | Patron | Librarian | Admin |
|---------|:------:|:---------:|:-----:|
| Dashboard, Catalog, Reader, My Books (feature 001) | ✅ | ✅ | ✅ |
| "Manage" nav entry | hidden | ✅ | ✅ |
| Manage → Inventory (create/edit/remove) | — | ✅ scoped | ✅ nationwide |
| Manage → Patrons (view/suspend/edit) | — | ✅ scoped | ✅ nationwide |
| Manage → Librarians (assign role + scope) | — | — | ✅ |
| Manage → Audit log | — | ▲ own scope (optional) | ✅ |

## Web (`apps/web`)

- `RequireRole` guard component wraps `app/manage/*` routes; redirects patrons away.
- `NavBar` shows the "Manage" link only when `canAccessManageArea(role)`.
- Management routes: `app/manage/inventory`, `app/manage/patrons`, `app/manage/librarians`
  (admin), each calling the Firestore writes / callable functions per contracts above.

## Mobile (`src/`)

- `AppNavigator` conditionally registers management screens by role.
- Home/nav entry to a "Manage" stack appears only for librarian/admin.
- Screens under `src/screens/manage/` mirror the web management surfaces.

## Contract requirements

- The UI MUST NOT render forbidden entry points (FR-011) — no dead links to denied areas.
- Every management action MUST still be authorized server-side; UI gating is convenience,
  not enforcement. A hidden button is never the only thing standing between a patron and a
  privileged write.
- Denied actions surfaced to users MUST use plain-language messaging (Principle II), e.g.
  "Only librarians for this library can edit its inventory."
- Role/scope displayed in the UI comes from the **token**, refreshed after changes.
