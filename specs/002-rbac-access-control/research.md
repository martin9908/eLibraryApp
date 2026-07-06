# Phase 0 Research: Role-Based Access Control

Resolved from the existing codebase (Firebase Auth + Firestore + Cloud Functions, no prior
role handling) and the constitution. No open `NEEDS CLARIFICATION` markers remain.

## R1 — Where does the role live?

- **Decision**: Store role as a **Firebase Auth custom claim** (`role`) — the authorization
  source of truth carried in the ID token — **and mirror** `role` + scope + status on the
  `users/{uid}` document for querying and UI. Firestore rules read the claim
  (`request.auth.token.role`) for authz decisions; the doc mirror is for lists/admin UI.
- **Rationale**: Custom claims are tamper-proof (signed into the token, not client-writable)
  and available to security rules with no extra read. A doc-only role would require a
  `get()` on every rule evaluation and could be edited by anyone with write access unless
  carefully locked. Claims + mirror is the Firebase-recommended RBAC pattern.
- **Alternatives considered**: (a) Role only on the `users` doc — weaker (client-tamperable
  unless perfectly ruled; costs a `get()` per check). (b) A separate authz service — over-
  engineered for three roles (violates Principle III / YAGNI).

## R2 — How are roles assigned (no client escalation)?

- **Decision**: All role/scope changes go through **callable Cloud Functions** using the
  **Admin SDK** (`setCustomUserClaims` + a mirrored doc write in one operation). The client
  never writes the role field. Rules forbid client writes to `role`/`scope`/`status`.
- **Rationale**: FR-003/FR-005/FR-007 — self-escalation must be impossible. Only a
  privileged server context can mint claims. This is the single elevated-privilege surface,
  and it is the *only* safe design (recorded in the plan's post-design gate).
- **Alternatives considered**: Client writes gated by rules that check the actor's claim —
  rejected: still lets a compromised admin session write arbitrary fields, and claims can't
  be set from rules anyway (must use Admin SDK).

## R3 — Claim propagation / role change mid-session

- **Decision**: After a role/scope change, the affected user's new access takes effect on
  the next **ID token refresh**. The client calls `getIdTokenResult(true)` (force refresh)
  on next focus/sign-in; management functions may also flag the user's doc so the client
  refreshes proactively. Acceptable per the spec edge case ("re-authentication/refresh is
  acceptable").
- **Rationale**: Custom claims propagate on token refresh (≤1h automatically, immediate on
  forced refresh). Simple and standard.
- **Alternatives considered**: Real-time claim revocation infrastructure — unnecessary
  complexity for this scope.

## R4 — Librarian scope model (library and/or region)

- **Decision**: Librarian scope = `assignedLibraryIds: string[]` **and/or**
  `assignedRegion: string`. A librarian may act on a target if the target's library is in
  `assignedLibraryIds` **or** the target's library `region` equals `assignedRegion`. Scope
  is stored on the `users` doc (and duplicated into the claim in compact form for rule
  checks that can't do cross-doc reads cheaply).
- **Rationale**: Directly matches "assigned library and/or region." Region-level librarians
  cover all libraries in a region; library-level librarians cover specific branches. Reuses
  the existing `libraries.region` field.
- **Alternatives considered**: Region-only or library-only — too rigid for the requirement.

## R5 — Enforcing scope in Firestore rules

- **Decision**: Rules authorize by role from the token. For **inventory** (`books`) and
  **patron** management, scope is enforced by comparing the target's owning library/region
  to the actor's scope. Because rules can't loop over arrays cheaply, the librarian's
  compact scope (library IDs + region) is embedded in the **custom claim**, and each
  manageable record (book, patron) carries its owning `libraryId`/`region`. Rule:
  `token.role == 'admin' || (token.role == 'librarian' && targetLibraryInScope)`.
- **Rationale**: Keeps authz decisions inside rules without extra reads. Admin bypasses
  scope (nationwide). Patron writes to management collections are always denied.
- **Alternatives considered**: Cross-document `get()` in rules for scope — works but adds a
  read per op and complicates rules; embedding compact scope in the claim is cheaper.

## R6 — Which mutations go through Functions vs. direct rules-guarded writes?

- **Decision**: **Role/scope/status changes and audit writes → Cloud Functions only**
  (privileged). **Inventory and patron-profile edits within scope → direct Firestore writes
  guarded by rules** (no function needed) where the rule can fully express the constraint;
  use a callable function when the operation spans multiple documents or needs invariants
  (e.g. deleting a book with active loans, last-admin protection).
- **Rationale**: Minimize serverless surface (Principle III/V) while keeping unsafe or
  multi-doc operations server-authoritative (Principle IV).
- **Alternatives considered**: Everything via Functions — simpler mental model but more
  cost/latency and more code; rejected for routine scoped edits rules can enforce.

## R7 — Default role & first-admin bootstrap

- **Decision**: New users default to **Patron** — set by an `onUserCreate`/auth-trigger
  Cloud Function that mints the `patron` claim and writes the mirror doc. The **first admin**
  is provisioned out-of-band via a one-off secure Admin-SDK script (documented in
  quickstart, not shipped as a callable).
- **Rationale**: FR-002; avoids a chicken-and-egg where no admin exists to create the first
  admin. Keeps escalation off the client.
- **Alternatives considered**: First-run "claim admin" screen — a security foot-gun;
  rejected.

## R8 — Last-admin protection & deactivation

- **Decision**: The `assignRole` function refuses to demote/remove the final admin (counts
  active admins first). Account `status: 'suspended'` is checked in rules (deny all writes)
  and at sign-in; suspended users cannot act.
- **Rationale**: FR-012/FR-014; prevents lockout and enforces deactivation server-side.
- **Alternatives considered**: UI-only guard — insufficient (Principle IV).

## R9 — Audit trail

- **Decision**: A dedicated `auditLog` collection, appended **only** by Cloud Functions,
  capturing `{ actorUid, actorRole, action, targetType, targetId, details, createdAt }`.
  Readable by admins (and librarians for their own scope, optional). Never client-writable.
- **Rationale**: FR-013/SC-007; server-only writes keep it trustworthy.
- **Alternatives considered**: Logging to Functions logs only — not queryable/presentable in
  the product; rejected.

## R10 — Consistent web + mobile gating

- **Decision**: Role/permission **types** live in `@elibrary/types`; each app has a small
  `lib/access.ts` exposing the same capability predicates (`canManageInventory(role,
  scope, targetLibrary)`, etc.). Both apps read role/scope from `getIdTokenResult`. UI shows
  only permitted nav/actions; the server remains the true boundary.
- **Rationale**: FR-011/FR-016 — identical behavior, no duplicated ad-hoc checks.
- **Alternatives considered**: A shared runtime access package — nice but the apps differ
  (RN vs web); shared *types* + parallel tiny helpers is lower-friction now (YAGNI).

## Resolved unknowns summary

| Topic | Decision |
|-------|----------|
| Role storage | Custom claim (source of truth) + `users` doc mirror |
| Assignment | Callable Cloud Functions (Admin SDK) only; no client role writes |
| Propagation | ID token refresh (`getIdTokenResult(true)`) |
| Librarian scope | `assignedLibraryIds` and/or `assignedRegion` |
| Scope enforcement | Compact scope in claim + owning `libraryId`/`region` on records; rules compare |
| Function vs rules | Privileged/multi-doc → Functions; scoped edits → rules-guarded writes |
| Default / bootstrap | Patron by default (auth trigger); first admin via secure script |
| Safety | Last-admin protection; `status:'suspended'` denies in rules & sign-in |
| Audit | `auditLog`, Functions-only writes |
| Cross-platform | Shared types + per-app `access.ts`; token-driven UI gating |
