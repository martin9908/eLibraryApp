---

description: "Task list for Role-Based Access Control (Patron / Librarian / Admin)"
---

# Tasks: Role-Based Access Control (Patron / Librarian / Admin)

**Input**: Design documents from `/specs/002-rbac-access-control/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (security-rules,
cloud-functions, ui-access), quickstart.md

**Tests**: Automated app/unit tests were NOT requested. **However**, per plan.md and
quickstart.md, **Firestore security-rules emulator tests are the designated primary
validation gate** for this feature (Constitution Principle IV — enforcement is server-side).
Rules-emulator test tasks are therefore included; broader unit/integration tests are out of
scope unless requested.

**Organization**: Tasks grouped by user story (Patron P1 → Librarian P2 → Admin P3) so each
role tier can be implemented and validated independently. **The security boundary (Firestore
rules + callable Cloud Functions) is the source of truth; UI gating is convenience only.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish carry no story label)
- Paths are relative to repo root `/Users/martinjaycyhalum/Developer/eLibraryApp`

## Path Conventions

Web + mobile clients over Firebase (Firestore + Auth + Cloud Functions). Privileged mutations
live in `functions/src/rbac/`; enforcement in `firestore.rules`; shared types in
`packages/types`; web gating in `apps/web/src`; mobile gating in repo-root `src/`.

---

## Phase 1: Setup

- [X] T001 Verify baseline builds: `pnpm install`, `pnpm typecheck` (web + mobile), and `pnpm --filter elibrary-functions build`; record baseline green.
- [ ] T002 [P] Start Firebase emulators (`firebase emulators:start` — firestore/functions/auth per `firebase.json`) and seed per `quickstart.md`: ≥2 `libraries` in different regions (e.g. `{ id:'libA', region:'Region1' }`, `{ id:'libB', region:'Region2' }`), `books` with `libraryId` pointing to each, and test users (patron; librarian assigned to Library A via `node functions/scripts/bootstrap-admin.js`; admin). **[Requires local emulator. Run once before validation tasks.]**

---

## Phase 2: Foundational (blocking prerequisites)

**⚠️ These define the role model, the enforcement boundary, and the privileged mutation path — every user story depends on them.**

- [X] T003 Extend `packages/types/src/index.ts`: add `Role` (`'patron'|'librarian'|'admin'`), `AccountStatus` (`'active'|'suspended'`), `LibrarianScope` (`assignedLibraryIds?`, `assignedRegion?`), extend the user profile shape with `role`/`status`/scope, add `libraryId`/`region` to `Book`, and `AuditEntry` — per `data-model.md`.
- [X] T004 [P] Mirror the same role/scope/status types + `Book.libraryId` + `AuditEntry` in mobile `src/types/library.ts` (mobile keeps its own local types).
- [X] T005 Create `functions/src/rbac/claims.ts` — Admin-SDK helpers to set/clear custom claims (`role`, compact `libs`, `region`) and mirror them onto `users/{uid}` in one operation (research R1/R2).
- [X] T006 Create `functions/src/rbac/audit.ts` — append-only writer for `auditLog` (`actorUid`, `actorRole`, `action`, `targetType`, `targetId`, `details`, `createdAt`); Functions-only (contracts/cloud-functions.md, data-model.md).
- [X] T007 Create `functions/src/rbac/onUserCreate.ts` — Auth `onCreate` trigger defaulting new users to the Patron claim + `users` mirror (`role:'patron'`, `status:'active'`) (FR-002, research R7); export it from `functions/src/index.ts`.
- [X] T008 Add `functions/scripts/bootstrap-admin.js` — one-off secure Admin-SDK script to grant the first `admin` claim + mirror doc to a given UID (research R7); document usage in `quickstart.md`. **[Run once, out-of-band.]**
- [X] T009 **Rewrite `firestore.rules`** as the enforcement boundary per `contracts/security-rules.md`: `role()/isAdmin()/isLibrarian()/libInScope()` helpers; owner-only personal collections; `books` writes gated by role + owning-library scope; `users` role/status/scope fields NOT client-writable; `auditLog` server-only; suspended users denied. **Central blocking task.**
- [X] T010 Update `firestore.indexes.json` for scoped/audit queries (e.g. `auditLog` by `createdAt` desc; any `books` by `libraryId`) per `contracts/security-rules.md`.
- [X] T011 [P] Extend `apps/web/src/context/AuthContext.tsx` to expose `role`, `scope`, `status` from `getIdTokenResult()` and a `refreshClaims()` (force-refresh) for post-change propagation (research R3, contracts/ui-access.md).
- [X] T012 [P] Extend mobile `src/context/AuthContext.tsx` the same way (role/scope/status from the ID token + `refreshClaims()`).
- [X] T013 [P] Create `apps/web/src/lib/access.ts` — pure capability predicates (`canManageInventory`, `canManagePatrons`, `canManageLibrarians`, `canAccessManageArea`, `inScope`) per `contracts/ui-access.md`.
- [X] T014 [P] Create mobile `src/lib/access.ts` mirroring the same predicates (identical behavior — FR-016).
- [X] T015 Rules-emulator harness: (1) `pnpm --filter elibrary-functions add --save-dev @firebase/rules-unit-testing mocha ts-node @types/mocha` in `functions/`; (2) create `functions/src/rbac/__tests__/rules.test.ts` with `initializeTestEnvironment({ projectId:'demo-elibrary', firestore:{ rules: readFileSync('firestore.rules','utf8') } })` scaffolding and a single smoke-test assertion (patron cannot write `books`); (3) add `"test:rules": "mocha --require ts-node/register src/rbac/__tests__/rules.test.ts"` to `functions/package.json` scripts; (4) confirm `firebase emulators:exec --only firestore \"pnpm --prefix functions run test:rules\"` passes.

**Checkpoint**: types + claims + trigger + rules + auth-context + access helpers exist; a seeded patron/librarian/admin can sign in and the client can read their role from the token.

---

## Phase 3: User Story 1 — Patron boundary (Priority: P1) 🎯 MVP

**Goal**: Patrons keep today's experience (browse/borrow/return/read) and are denied — and shown no entry points to — all management, enforced server-side.

**Independent Test**: Sign in as a patron; browse/borrow/return/read work; no management nav is visible; direct management writes are denied by rules; a new signup defaults to Patron; self-escalation attempts fail.

- [X] T016 [P] [US1] Create `apps/web/src/components/RequireRole.tsx` — a guard that redirects users lacking a required role away from protected routes (uses `access.ts` + AuthContext).
- [X] T017 [P] [US1] Gate the web "Manage" entry point: show it only when `canAccessManageArea(role)` in `apps/web/src/components/NavBar.tsx` (hidden for patrons — FR-011).
- [X] T018 [P] [US1] Gate mobile management navigation in `src/navigation/AppNavigator.tsx`: (a) add `Manage: undefined` to `RootTabParamList` in `src/types/navigation.ts`; (b) create `src/screens/manage/ManageRootScreen.tsx` (placeholder entry screen with "Inventory" + "Patrons" buttons, admin adds "Librarians"); (c) in `TabNavigator`, import `useAuth` + `canAccessManageArea` from `src/lib/access.ts` and conditionally render `<Tab.Screen name="Manage" component={ManageRootScreen} …>` only when `canAccessManageArea(role)` is true (hidden for patrons — FR-011, contracts/ui-access.md).
- [X] T019 [US1] Rules-emulator tests in `functions/src/rbac/__tests__/rules.test.ts` (T015 harness): assert patron (token `{ role:'patron' }`) is **denied** `books` create/update/delete; denied any write to `users/{uid}.role`, `users/{uid}.status`, `users/{uid}.assignedLibraryIds`; denied write to own doc's role field; **allowed** `borrowRecords` create for own uid; **allowed** `books` read. Cover FR-003, FR-007, FR-008, SC-001, SC-002, SC-005.
- [ ] T020 [US1] Validate US1 in `quickstart.md` scenarios 1–5 against the running emulator (patron features work; no Manage tab visible; direct book-write denied; new signup defaults to patron; self-role-write denied); run `pnpm typecheck` + `pnpm lint`; confirm green.

**Checkpoint**: Patron tier is safe and demoable on its own — the security baseline everyone builds on.

---

## Phase 4: User Story 2 — Librarian scoped management (Priority: P2)

**Goal**: Librarians gain scoped inventory + patron management (assigned library/region only); cannot act outside scope or touch librarian/admin accounts or roles.

**Independent Test**: Librarian for Library A manages Library A inventory/patrons; is denied for Library B; cannot change any role or manage a librarian/admin; retains patron features.

- [X] T021 [P] [US2] `functions/src/rbac/setAccountStatus.ts` — suspend/reactivate; librarian limited to **patrons within scope**, admin any (except last admin); clears role claim on suspend; audits (FR-006/009/014, contracts/cloud-functions.md); export from `index.ts`.
- [X] T022 [P] [US2] `functions/src/rbac/updatePatron.ts` — scoped patron-profile updates (never `role`); librarian-in-scope or admin only; audits when non-owner (FR-006/009); export from `index.ts`.
- [X] T023 [P] [US2] `functions/src/rbac/deleteBook.ts` — scoped delete with the **active-loans invariant** (refuse/require resolution); audits (FR-015); export from `index.ts`.
- [X] T024 [US2] Web inventory management: `apps/web/app/manage/inventory/page.tsx` (+ needed components) — create/edit inventory via rules-guarded Firestore writes, delete via `deleteBook`; scoped to the librarian's libraries (FR-009).
- [X] T025 [US2] Web patron management: `apps/web/app/manage/patrons/page.tsx` — list/view/suspend/edit patrons within scope via `setAccountStatus`/`updatePatron` (FR-009).
- [ ] T026 [P] [US2] Mobile management screens: (a) `src/screens/manage/ManageInventoryScreen.tsx` — list books for librarian's assigned libraries (query `books` where `libraryId in scope`); create via Firestore `addDoc`; edit via `updateDoc`; delete via callable `deleteBook`; scope-filtered using `canManageInventory(role, scope, book)` from `src/lib/access.ts`; admin sees all (FR-009, FR-016); (b) `src/screens/manage/ManagePatientsScreen.tsx` — list patrons (`users` where `homeLibraryId in scope`), view detail, call `setAccountStatus` + `updatePatron` callables; scope-filtered via `canManagePatrons(role, scope, …)`; admin sees all (FR-009). Register both screens in `ManageRootScreen.tsx` (T018). Mirror web surfaces (contracts/ui-access.md).
- [ ] T027 [US2] Rules-emulator tests in `functions/src/rbac/__tests__/rules.test.ts`: librarian token `{ role:'librarian', libs:['libA'] }` **can** write `books` where `libraryId:'libA'`; **denied** `books` where `libraryId:'libB'`; **denied** any `users.role` write (own or other); **denied** write to a patron outside scope; admin token bypasses all scope checks. Cover FR-006, FR-009, SC-003.
- [ ] T028 [US2] Validate US2 in `quickstart.md` scenarios 6–10 against the emulator (librarian manages Library A; denied Library B; no role changes; patron features retained); run `pnpm typecheck` + `pnpm lint`; confirm green.

**Checkpoint**: US1 + US2 function independently; librarian confined to scope.

---

## Phase 5: User Story 3 — Admin nationwide (Priority: P3)

**Goal**: Admins manage librarians/patrons/inventory nationwide, assign the librarian role + scope; last-admin protected; all privileged actions audited.

**Independent Test**: Admin assigns a librarian (with scope) and it takes effect within a refresh; admin manages any library; demoting the last admin is refused; role changes appear in the audit log.

- [X] T029 [P] [US3] `functions/src/rbac/assignRole.ts` — admin-only assign/revoke `patron|librarian|admin` + librarian scope; sets claim + mirror; **refuses to demote/remove the last active admin**; audits (`role.assign`/`role.revoke`) (FR-005/010/012, SC-004/006); export from `index.ts`.
- [X] T030 [US3] Web librarian management: `apps/web/app/manage/librarians/page.tsx` — admin assigns/revokes roles and library/region scope via `assignRole`; triggers target `refreshClaims()` guidance (FR-005/010).
- [ ] T031 [P] [US3] Mobile admin management screen `src/screens/manage/ManageLibrariansScreen.tsx` — admin-only: list users with `role:'librarian'` or `role:'admin'`; assign/revoke librarian role + `assignedLibraryIds`/`assignedRegion` via `assignRole` callable; show assigned scope; disable demote for last admin (surface `failed-precondition` error in plain language); guard with `canManageLibrarians(role)` check. Register in `ManageRootScreen.tsx` (T018) under "Librarians" button (admin only — contracts/ui-access.md).
- [X] T032 [P] [US3] Audit-log view: `apps/web/app/manage/audit/page.tsx` (admin) reading `auditLog` (FR-013, SC-007); optional scoped view for librarians.
- [X] T033 [US3] Admin scope-bypass: ensure inventory/patron management UIs allow nationwide action for admins (reuse US2 surfaces with admin capability) (FR-010).
- [ ] T034 [US3] Rules/functions-emulator tests in `functions/src/rbac/__tests__/rules.test.ts`: admin token bypasses scope for all `books`/`users` writes; `assignRole` callable refuses last-admin demotion (`failed-precondition`); `assignRole` writes `auditLog` entry with correct `actorUid`, `action:'role.assign'`, `targetId`; suspended token (no `role` claim) is denied all guarded writes. Cover FR-010, FR-012, FR-013, SC-004, SC-006, SC-007.
- [ ] T035 [US3] Validate US3 in `quickstart.md` scenarios 11–14 against the emulator (admin assigns librarian + scope takes effect within a refresh; admin manages any library; last-admin demotion refused; audit entries present); run `pnpm typecheck` + `pnpm lint`; confirm green.

**Checkpoint**: All three tiers function; nationwide admin + safeguards in place.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T036 [P] Accessibility (Principle I / WCAG 2.1 AA) pass on all new `manage/*` surfaces: web — audit keyboard focus order and ARIA landmarks in `apps/web/app/manage/**`; mobile — add `accessibilityLabel` + `accessibilityRole` props to buttons/inputs in `src/screens/manage/*.tsx`. No regression on existing patron screens.
- [ ] T037 [P] Plain-language denial messaging (Principle II): map each callable's `permission-denied` / `failed-precondition` error code to a human-readable string in a new `src/lib/errorMessages.ts` (mobile) and `apps/web/src/lib/errorMessages.ts` (web); surface via toast/alert in all management screens. Examples: "Only librarians for this library can edit its inventory", "You cannot remove the last admin account".
- [ ] T038 Complete the **rules-emulator test suite** as the security gate: expand `functions/src/rbac/__tests__/rules.test.ts` to cover all cross-user, cross-scope, escalation, last-admin, and suspended-account scenarios from `quickstart.md` scenarios 1–17; all assertions must be green (Principle IV; SC-001/003/005/006).
- [ ] T039 Deploy/verify `firestore.rules` + `firestore.indexes.json` to the target Firebase project (`firebase deploy --only firestore:rules,firestore:indexes`); smoke-test claims propagation end-to-end by calling `getIdTokenResult(true)` after `assignRole` and confirming role/scope reflects in the next request.
- [ ] T040 Full-feature validation: run all 17 `quickstart.md` scenarios (web + mobile parity for scenarios 1–3, 6–9 per scenario 17) + `pnpm typecheck` + `pnpm lint`; confirm all green; mark feature branch ready for review.

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** → **User Stories (P3–P5, in priority order)** → **Polish (P6)**.
- **Phase 2 blocks everything.** Hard prerequisites: T003 (types) before any service/UI; **T009 (rules rewrite)** before any story verification; T005–T007 (claims/trigger) before role-dependent behavior; T011–T014 (auth context + access helpers) before UI gating.
- **Story independence**: US1/US2/US3 touch largely disjoint functions, `manage/*` routes, and screens. They converge only on shared `firestore.rules` + `functions/src/index.ts` exports (sequential edits, independent logic).
- **Polish** depends on the stories existing; **T038 (rules test suite) is the required security gate** before "done" (Principle IV).

### Story completion order (by priority)
1. **US1 (P1)** — MVP: patron boundary (T016–T020)
2. **US2 (P2)** — librarian scoped management (T021–T028)
3. **US3 (P3)** — admin nationwide (T029–T035)

## Parallel Execution Examples

- **Phase 2**: T004, T011, T012, T013, T014 are `[P]` (distinct files) after T003 lands; T009/T010 (rules/indexes) proceed in parallel with client work.
- **US1**: T016, T017, T018 `[P]` → then T019 (rules tests), T020 (validate).
- **US2**: T021, T022, T023 (functions) and T026 (mobile) `[P]` → T024/T025 (web UIs) → T027/T028.
- **US3**: T029 (function), T031, T032 `[P]` → T030/T033 → T034/T035.
- **Polish**: T036, T037 `[P]`.

## Implementation Strategy

- **MVP = Phase 1 + Phase 2 + Phase 3 (US1)**: the role model, server-side enforcement, and a locked-down patron tier — the security foundation, independently shippable.
- **Incremental delivery**: add US2 (librarian scoped management), then US3 (admin nationwide); each is a self-contained tier behind the same enforcement boundary.
- **Non-negotiables** (Constitution Principle IV): enforcement is in `firestore.rules` + callable functions, never client-only; **no client path may change a role**; the rules-emulator suite (T038) and last-admin protection (T029/T034) are required before completion.
