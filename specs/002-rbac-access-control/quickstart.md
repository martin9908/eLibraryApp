# Quickstart & Validation: Role-Based Access Control

Validation guide proving the three roles and their boundaries work end-to-end. Enforcement
detail is in `contracts/`; schemas in `data-model.md`. Implementation lives in `tasks.md`.

## Prerequisites

- `pnpm install` at repo root.
- Firebase project configured; **Firestore + Auth emulators** available
  (`firebase.json` already defines emulators: firestore 8080, functions 5001).
- Functions deps installed (`functions/`).
- Seed data:
  - ≥ 2 `libraries` in **different regions** (e.g. Library A / Region 1, Library B / Region 2).
  - `books` owned by each library (`libraryId` set).
  - Test users: one **patron**, one **librarian** assigned to Library A, one **admin**.

## First-admin bootstrap (out-of-band, one time)

```bash
# Documented secure Admin-SDK script (not a client-callable):
# sets custom claim { role: 'admin' } on a known uid and mirrors the users doc.
node functions/scripts/bootstrap-admin.js <ADMIN_UID>   # (script added during implementation)
```

## Run

```bash
firebase emulators:start           # firestore + functions + auth
pnpm --filter @elibrary/web dev     # web on :3000
pnpm start                          # mobile (Expo)
```

## Static & rules checks

```bash
pnpm typecheck                      # web + mobile + functions build
pnpm lint
# Security-rules tests are the KEY gate for this feature:
firebase emulators:exec "npm --prefix functions run test:rules"   # (rules tests added in tasks)
```

## Validation scenarios (map to spec acceptance)

### US1 — Patron boundary (P1)
1. As **patron**: browse, borrow, return, read all succeed. **(FR-008)**
2. As patron: no "Manage" entry point is visible on web or mobile. **(FR-011, SC-002)**
3. As patron, **direct** attempt (emulator/console) to write a `books` doc or another
   user's doc → **denied by rules**. **(FR-007, SC-001)**
4. Register a new account → it is **patron**, `status:'active'`. **(FR-002)**
5. As patron, attempt to set own `role:'admin'` via client write → **denied**. **(FR-003, SC-005)**

### US2 — Librarian scope (P2)
6. As **librarian (Library A)**: create/edit/remove a Library A book → succeeds. **(FR-009)**
7. Same librarian: attempt to edit a **Library B** book → **denied**. **(SC-003)**
8. Librarian: view/suspend a **Library A patron** → succeeds; a **Library B patron** →
   denied. **(FR-006, FR-009)**
9. Librarian: attempt `assignRole` or to manage a librarian/admin → **permission-denied**. **(FR-006)**
10. Librarian retains patron features (borrow/return/read). **(FR-005 hierarchy)**

### US3 — Admin nationwide (P3)
11. As **admin**: `assignRole({ targetUid, role:'librarian', assignedLibraryIds:['B'] })` →
    that user can now manage Library B within one token refresh. **(FR-005, SC-004)**
12. Admin: manage inventory/patrons for any library → succeeds. **(FR-010)**
13. Admin: attempt to demote the **last remaining admin** → **failed-precondition**. **(FR-012, SC-006)**
14. Any role change / nationwide action appears in `auditLog` with actor/target/timestamp. **(FR-013, SC-007)**

### Cross-cutting
15. Suspend a patron → they cannot sign in or write; reactivate restores access. **(FR-014)**
16. Delete a book that has **active loans** → refused until resolved. **(FR-015)**
17. Repeat scenarios 1–3 and 6–9 on **mobile** → identical outcomes to web. **(FR-016, SC-008)**

## Expected outcome

All 17 scenarios pass; rules-emulator tests green; typecheck + lint clean. No client action
can elevate a role, patrons see zero management surfaces, librarians are confined to scope,
admins act nationwide, the last admin is protected, and privileged actions are audited.
