# Implementation Plan: Role-Based Access Control (Patron / Librarian / Admin)

**Branch**: `002-rbac-access-control` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-rbac-access-control/spec.md`

## Summary

Introduce three roles — **Patron**, **Librarian**, **Admin** — with a strict capability
hierarchy (Admin ⊇ Librarian ⊇ Patron) enforced at the **data/server layer**, not just the
UI. Patrons keep today's experience (browse/borrow/return/read). Librarians gain
inventory and patron management **scoped to their assigned library/region**. Admins gain
nationwide management plus the ability to assign librarians and their scope.

Technical approach: role is stored as a **Firebase Auth custom claim** (the authorization
source of truth, present in the ID token) and mirrored on `users/{uid}` (with scope +
status) for querying and UI. Role/scope changes and all privileged management run through
**callable Cloud Functions** using the Admin SDK — the client can never set its own role.
**Firestore security rules** enforce every read/write against the caller's token role and
scope. Both apps (Next.js web, Expo mobile) gate navigation/actions by role via shared
types and a small role helper. This directly satisfies the constitution's Security &
Privacy principle by making escalation impossible from the client.

## Technical Context

**Language/Version**: TypeScript ~5.9; React 19 / Next.js 15 (web); React Native 0.81 /
Expo 54 (mobile); Node.js 20 (Cloud Functions).

**Primary Dependencies**: `firebase` client SDK (Auth custom claims via `getIdTokenResult`),
`firebase-admin` + `firebase-functions` (already in `functions/`), shared `@elibrary/types`.
No new third-party runtime dependency expected.

**Storage**: Cloud Firestore. Extends `users` (role, scope, status). Reuses `libraries`
(region), `books` (+ owning library association for scope), `borrowRecords`. New
`auditLog` collection. Role also lives in the Auth token as a custom claim.

**Testing**: No formal runner configured. Validation via `pnpm typecheck` (both apps +
functions build), `pnpm lint`, the **Firestore security-rules emulator** (rules unit
tests are the key gate for this feature), and the manual scenarios in `quickstart.md`.

**Target Platform**: Web (modern browsers) + mobile (iOS/Android) + Cloud Functions.

**Project Type**: Web + mobile client apps over Firebase (Firestore + Auth + Functions).

**Performance Goals**: Role checks add no perceptible latency — role is read from the
already-present ID token (no extra round trip); scope checks use indexed queries.

**Constraints**: Enforcement MUST be server-side (rules + functions); UI gating is
secondary. No client path may elevate a role. Reader-privacy narrows, never widens. Last
admin protected. Behavior identical on web and mobile.

**Scale/Scope**: 3 roles; librarian scope = set of library IDs and/or a region; nationwide
admin. Adds role/scope/status fields, ~5–8 callable functions, rules rewrite, an audit
collection, and role-gated UI + minimal management surfaces on both apps.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Accessibility First | Any new management UI meets WCAG 2.1 AA; role-gated nav stays keyboard/screen-reader operable. | ✅ Applies to new surfaces; carried into design/tasks. |
| II. Inclusivity for All | Plain-language role/permission messaging; denied actions explained, not cryptic. | ✅ FR-011; error copy guidance in research. |
| III. Purposeful Innovation | Reuse Firebase-native primitives (custom claims, rules, callable functions); no new framework; start with 3 roles (YAGNI, no ABAC). | ✅ Simplest viable model; alternatives rejected in research R1/R2. |
| IV. Security & Privacy by Design | Server-side enforcement; no client escalation; least privilege; audit; last-admin protection. | ✅ **Core of this feature** — FR-003/007/012/013; rules-emulator gate. |
| V. Community Service & Sustainability | No new infra/cost (uses existing Functions + Firestore); maintainable by staff; enhances library operations. | ✅ Reuses current stack; scoped management supports local libraries. |

**Initial gate result**: PASS — no violations. Complexity Tracking not required.

**Post-design re-check (after Phase 1)**: PASS — design keeps role in the token + a mirror
doc, all mutations behind Admin-SDK callable functions, and rules as the enforcement
boundary. The one elevated-privilege surface (Cloud Functions) is justified because
server-authoritative role changes are the *only* safe design (see research R2); this is
recorded, not a violation, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-rbac-access-control/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── security-rules.md   # Firestore rules contract (enforcement boundary)
│   ├── cloud-functions.md  # Callable admin/management function contracts
│   └── ui-access.md        # Role→capability→surface matrix for web + mobile
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
packages/types/src/index.ts        # EXTEND: Role, AccountStatus, LibrarianScope,
                                    #         User role/scope/status, AuditEntry

functions/src/                      # Privileged, server-authoritative operations
├── index.ts                        # EXTEND: export new callables
├── rbac/
│   ├── claims.ts                   # set/refresh custom claims (Admin SDK)
│   ├── assignRole.ts               # admin: assign/revoke role + librarian scope
│   ├── managePatron.ts             # librarian/admin: scoped patron management
│   ├── manageInventory.ts          # librarian/admin: scoped inventory writes (or via rules)
│   ├── onUserCreate.ts             # default new users to Patron claim + doc
│   └── audit.ts                    # append to auditLog
firestore.rules                     # REWRITE: role/scope-aware read/write enforcement
firestore.indexes.json              # EXTEND: indexes for scoped queries + auditLog

apps/web/src/                       # Web role gating + management surfaces
├── context/AuthContext.tsx         # EXTEND: expose role/scope from ID token claims
├── lib/access.ts                   # NEW: role/scope capability helpers (shared logic)
├── components/RequireRole.tsx      # NEW: route/section guard
└── app/manage/                     # NEW: librarian/admin management routes (inventory, people)

src/                                # Mobile role gating + management surfaces
├── context/AuthContext.tsx         # EXTEND: expose role/scope from ID token claims
├── lib/access.ts                   # NEW: mirror of capability helpers
├── navigation/AppNavigator.tsx     # EXTEND: role-gated screens
└── screens/manage/                 # NEW: librarian/admin management screens
```

**Structure Decision**: Web + mobile clients over Firebase. The **authorization boundary
lives in Firestore security rules and Cloud Functions** (server-authoritative); the client
apps only *reflect* the role for UX. Role logic is centralized in a small `access.ts`
helper on each app (kept in sync; role/type definitions shared via `@elibrary/types`) so
web and mobile behave identically (FR-016). Management UIs are additive routes/screens
gated by role.

## Complexity Tracking

> No constitution violations. Section intentionally left empty.
