# Contract: Callable Cloud Functions (privileged operations)

Role/scope/status changes and multi-document invariants run **only** here (Admin SDK,
`functions/`). The client can never perform these directly. Each function verifies the
**caller's** claim, enforces scope, writes an audit entry, and (for role changes) sets the
target's custom claim + mirrors the `users` doc in one logical operation.

Signatures are the contract (TypeScript-ish); bodies belong to `tasks.md`.

## Auth trigger

```ts
// functions/src/rbac/onUserCreate.ts — Firebase Auth onCreate trigger
// Mints the default Patron claim and writes the users/{uid} mirror.
onUserCreate(user): // sets claim { role: 'patron' }, users doc { role:'patron', status:'active' }
```

## Role & scope management (admin only)

```ts
assignRole(input: {
  targetUid: string;
  role: 'patron' | 'librarian' | 'admin';
  assignedLibraryIds?: string[];   // required when role === 'librarian' (unless region given)
  assignedRegion?: string;         // optional librarian region scope
}): { ok: true }
```
Contract:
- Caller MUST be `admin` (FR-005); else `permission-denied`.
- Setting `librarian` MUST persist scope into both the claim (`libs`/`region`) and the doc.
- MUST refuse to demote/remove the **last active admin** (FR-012 → `failed-precondition`).
- MUST write an `auditLog` entry (`role.assign`/`role.revoke`).
- New claim takes effect on the target's next token refresh (research R3).

## Account status (librarian scoped, admin nationwide)

```ts
setAccountStatus(input: { targetUid: string; status: 'active' | 'suspended' }): { ok: true }
```
Contract:
- `admin` may suspend/reactivate anyone except the last admin.
- `librarian` may suspend/reactivate only **patrons within their scope** (FR-006/FR-009).
- Suspending MUST clear the target's role claim (so rules deny) and set `status:'suspended'`.
- MUST audit (`patron.suspend` / `account.reactivate`).

## Patron management (librarian scoped, admin nationwide)

```ts
updatePatron(input: { targetUid: string; changes: { homeLibraryId?; memberType?; ... } }): { ok: true }
```
Contract:
- Caller MUST be `librarian` (target patron in scope) or `admin`; never a patron.
- MUST NOT change `role` (that is `assignRole` only).
- MUST audit when performed by non-owner.

## Inventory operations requiring invariants

```ts
deleteBook(input: { bookId: string }): { ok: true }
```
Contract:
- Caller MUST have scope over the book's `libraryId` (`librarian`) or be `admin`.
- MUST refuse if the book has **active loans** (FR-015 → `failed-precondition`), or
  reassign/close them per policy.
- MUST audit (`book.delete`).

> Routine in-scope inventory create/edit (no cross-doc invariant) is done via **direct
> Firestore writes guarded by rules** (see `security-rules.md`), not a function.

## Cross-cutting contract

- Every function: (1) reject unauthenticated/suspended callers, (2) re-check the caller's
  role/scope server-side (never trust client input for authz), (3) audit privileged actions,
  (4) return typed, plain-language errors (`permission-denied`, `failed-precondition`,
  `invalid-argument`) the UI can surface clearly (Principle II).
- Functions run with Admin SDK privileges and therefore **bypass security rules** — they are
  the only trusted mutation path for role/status/scope and `auditLog`.
