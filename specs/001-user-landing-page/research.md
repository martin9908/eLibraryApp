# Phase 0 Research: Member Landing Dashboard (Nationwide)

All items below were resolved from the existing codebase and the constitution; no open
`NEEDS CLARIFICATION` markers remain.

## R1 — Route placement: `/dashboard` vs. enhancing `/`

- **Decision**: Add a dedicated authenticated route at `apps/web/app/dashboard/page.tsx`.
  Signed-in members are routed to `/dashboard`; unauthenticated visitors keep the existing
  public `/` hero. The dashboard client-guards the session (redirect to `/login` when no user),
  matching the pattern already used in `app/account/page.tsx`.
- **Rationale**: The spec scopes this feature to the *authenticated* home and marks the public
  landing Out of Scope. A separate route avoids branching one page on auth state (the current
  `/` does a little of this) and keeps the dashboard's data-fetching from running for anonymous
  visitors. Minimal, reversible.
- **Alternatives considered**: (a) Replace `/` with the dashboard and move the public hero
  elsewhere — larger blast radius, touches Out-of-Scope surface. (b) Conditionally render
  dashboard inside `/` — mixes concerns and complicates the guard/redirect story.

## R2 — Home Library (branch) model for "nationwide"

- **Decision**: Introduce a `libraries` Firestore collection (branch documents: name, region,
  service hours, contact) and a `homeLibraryId` field on the `users` profile document. The
  dashboard reads the member's `homeLibraryId`, then the corresponding `libraries/{id}` doc to
  render service hours / open-now and physical-collection context. When `homeLibraryId` is
  unset, branch-specific panels show a "select your library" prompt (edge case in spec).
- **Rationale**: Smallest change that removes the single-municipality assumption while reusing
  the existing per-user `users` document (already present, holds `expoPushToken`). National
  digital content stays global (existing `books` collection); only branch context is scoped.
- **Alternatives considered**: (a) Hard-code a national default with no branches — fails
  SC-007's "any participating library" and the mockup's per-branch hours. (b) Full
  multi-tenant catalog partitioning — violates YAGNI (Principle III); not needed for the
  dashboard and far beyond this feature.

## R3 — In-app notifications feed

- **Decision**: Add a `notifications` collection keyed by `userId`, each doc with
  `{ userId, category, title, body, read, createdAt }`. The dashboard queries the member's
  recent notifications (ordered by `createdAt` desc, `limit`), shows an unread count, and
  supports mark-one / mark-all-read via `updateDoc`. Generation of notifications is Out of
  Scope (existing Cloud Functions already send push; writing feed docs is a separate concern).
- **Rationale**: The current system only does **push** (Expo) via `functions/src/index.ts`;
  there is no readable in-app history. FR-009/FR-010/FR-011 require a persisted, mark-readable
  feed, so a dedicated collection is the minimal addition. Read/limit pattern mirrors
  `getAllBorrowRecords`.
- **Alternatives considered**: (a) Derive the feed purely from `borrowRecords` (due reminders,
  returns) — cannot represent "new book available" and has no per-item read state. (b) Store
  notifications as a subcollection under `users/{uid}` — viable, but a top-level collection
  keeps the query/security pattern identical to `borrowRecords` and simpler to reason about.

## R4 — Due Soon / Overdue derivation

- **Decision**: Derive Due Soon and Overdue entirely from existing `borrowRecords` where
  `returned == false`, comparing `dueDate` to now. Classify: **overdue** (`dueDate < now`),
  **due soon** (`dueDate` within a reminder window, default **3 days**), otherwise not shown.
  Urgency label is human-readable ("Overdue", "Due tomorrow", "N days left") and paired with a
  non-color indicator (icon/text) per FR-017.
- **Rationale**: No new storage needed; `borrowRecords` already carries `dueDate`/`returned`.
  Reuses `getAllBorrowRecords` + `getBooksByIds` already in `libraryService.ts`.
- **Alternatives considered**: Precompute due-soon server-side — unnecessary; the client
  already loads the member's records for the account page and the set is small (bounded by
  active loans).

## R5 — Featured selection

- **Decision**: Add an optional `featured?: boolean` field to `books`. The dashboard queries
  `where('type','==','ebook') && where('featured','==',true)` with a `limit`. Fallback when no
  books are flagged: reuse the current behavior (most recent/any eBooks, sliced) so the panel is
  never empty during rollout.
- **Rationale**: The existing home page uses `getAllBooks({type:'ebook'}).slice(0,5)` — no real
  curation. A boolean flag is the simplest curation primitive and keeps librarians in control
  (Principle V). Curation UI itself is Out of Scope.
- **Alternatives considered**: A separate `featuredSelections` collection with ordering/rotation
  — more capable but more than the dashboard needs now (YAGNI).

## R6 — Reader privacy & Firestore security rules

- **Decision**: Every dashboard query is keyed on the authenticated `auth.uid`
  (`where('userId','==', user.uid)`). Document that Firestore **security rules** MUST restrict
  `borrowRecords`, `notifications`, and `readingProgress` reads/writes to
  `resource.data.userId == request.auth.uid`, and `users/{uid}` to the owner. Rules enforcement
  is called out as a required implementation gate (constitution Principle IV) even though this
  feature only reads.
- **Rationale**: Client-side scoping alone is not a security boundary; rules are. FR-020 makes
  owner-only visibility non-negotiable. Repo has `firebase.json` but rules are the enforcement
  point to verify.
- **Alternatives considered**: Trust client queries only — rejected; violates Principle IV.

## R7 — Continue Reading (reading progress)

- **Decision**: Add a `readingProgress` collection keyed by `userId` +`bookId` storing
  `{ userId, bookId, currentPage, totalPages, updatedAt }`. The dashboard shows the most
  recently updated in-progress items and links into the existing in-app reader
  (`PdfReader`) at the stored page. Whether the reader *writes* progress is a small companion
  change; the dashboard's contract is the **read + resume-link**.
- **Rationale**: FR-014 requires resume-at-last-position, and no progress is persisted today
  (not in `@elibrary/types`). A dedicated small collection is consistent with existing patterns.
- **Alternatives considered**: Store progress inside `borrowRecords` — conflates loan state with
  reading state and doesn't cover previously-read/returned titles.

## R8 — Internationalization (multi-language capability)

- **Decision**: Author all dashboard copy as centralized string constants (a single module) with
  no hard-coded inline literals scattered across components, so a locale layer can be introduced
  without refactoring markup. Do not add an i18n library in this feature (YAGNI); the constraint
  is "MUST support presentation in more than one language where reasonably achievable" — met by
  keeping strings externalized and layout tolerant of longer translated text.
- **Rationale**: Principle II + FR-019 without over-building. Externalized strings are the
  low-cost enabler; a full i18n runtime is a separate, later decision.
- **Alternatives considered**: Adopt `next-intl`/`next i18n routing` now — premature; adds
  dependency and routing complexity before a second locale is committed.

## R9 — Accessibility approach

- **Decision**: Semantic landmarks (`header`, `nav`, `main`, `aside`), a visible focus ring,
  keyboard-reachable controls, `aria-live` for the notifications unread count, text/icon (not
  color-only) urgency indicators, alt text on covers, and contrast validated against the
  national palette tokens. Validate with keyboard-only walkthrough + an automated a11y checker
  during the quickstart.
- **Rationale**: Directly satisfies FR-017 and SC-005; reuses existing `globals.css` tokens
  which already encode contrast-minded neutrals.
- **Alternatives considered**: Defer a11y to a later pass — rejected; Principle I forbids
  shipping a regression and this is a net-new surface.

## R10 — Data loading & resilience

- **Decision**: Load dashboard panels with independent, `Promise.allSettled`-style fetches so one
  failing panel (e.g., library hours) does not blank the whole page; each panel renders its own
  loading skeleton, empty state, and last-known/error fallback. Cap all lists per FR-012 with a
  "view all" link to the relevant existing route.
- **Rationale**: FR-018/FR-021 + SC-004 require graceful degradation and no unusable blank state.
  Per-panel isolation is the simplest way to guarantee it.
- **Alternatives considered**: Single aggregate fetch that fails atomically — one error would
  blank the dashboard; rejected.

## Resolved unknowns summary

| Topic | Decision |
|-------|----------|
| Route | New `/dashboard`, client-guarded |
| Nationwide model | `libraries` collection + `users.homeLibraryId` |
| Notifications | New `notifications` collection, mark-read |
| Due soon/overdue | Derived from `borrowRecords` (3-day window) |
| Featured | `books.featured` flag + fallback |
| Privacy | uid-scoped queries + security-rules gate |
| Continue reading | New `readingProgress` collection |
| i18n | Externalized strings, no library yet |
| A11y | Semantic + keyboard + non-color status, validated |
| Resilience | Per-panel isolated fetch + fallbacks |
