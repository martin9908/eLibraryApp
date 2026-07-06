---

description: "Task list for Member Landing Dashboard (Nationwide)"
---

# Tasks: Member Landing Dashboard (Nationwide)

**Input**: Design documents from `/specs/001-user-landing-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated tests were NOT requested in the spec (validation is via typecheck + lint +
the manual scenarios in `quickstart.md`). No automated test tasks are generated. Do not add them
unless explicitly requested.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated
independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish have no story label)
- All paths are relative to the repo root `/Users/martinjaycyhalum/Developer/eLibraryApp`

## Path Conventions

Web application (front-end only, Firestore-backed). Feature lives in `apps/web`; shared domain
types in `packages/types`. Matches the existing App-Router + `src/services` + `src/components`
pattern.

---

## Phase 1: Setup

- [X] T001 Verify workspace builds cleanly before changes: run `pnpm install` then `pnpm --filter @elibrary/web typecheck` and `pnpm lint` from repo root; record baseline. (Baseline: web typecheck clean; root `eslint .` has pre-existing monorepo-wide noise incl. `@/`-alias `import/no-unresolved` and missing Next plugin rules — not introduced by this feature.)
- [X] T002 [P] Seed Firestore per `specs/001-user-landing-page/quickstart.md` "Prerequisites" — done via `functions/scripts/seed-dashboard.js` (libraries, featured/zero-copy books, member profile, due-soon+overdue loans, unread notification, readingProgress, second-user isolation data).

---

## Phase 2: Foundational (blocking prerequisites)

**⚠️ These MUST complete before any user story phase — they define shared types, service files, the route shell, and styles all panels depend on.**

- [X] T003 Extend shared domain types in `packages/types/src/index.ts`: add `Library` (+ embedded `LibraryHours`), `Notification`, `ReadingProgress`, add `featured?: boolean` to `Book`, and a `UserProfile` shape with `homeLibraryId?` and `memberType?` — per `data-model.md`.
- [X] T004 Add centralized dashboard copy module `apps/web/src/lib/dashboardStrings.ts` (all labels/empty-state/CTA text as constants, no inline literals) to satisfy FR-019 / research R8.
- [X] T005 [P] Extend `apps/web/app/globals.css` with dashboard layout (main + right-rail grid) and panel/card/skeleton/urgency-badge styles reusing existing tokens (`--indigo`, `--surface`, `--ink`, etc.) and existing classes where possible; ensure visible focus ring and non-color-only urgency styling (FR-017).
- [X] T006 Create the authenticated route shell `apps/web/app/dashboard/page.tsx` (`'use client'`) with the `useAuth()` guard: spinner while `initialising`, redirect to `/login` when `!user`, and a semantic `header/main/aside` layout scaffold with placeholders for the 8 panels (mirrors `app/account/page.tsx` guard pattern).
- [X] T007 Route authenticated members to `/dashboard`: update post-login navigation in `apps/web/app/login/page.tsx` (and register flow if it auto-signs-in) to push `/dashboard`, and point the NavBar brand/home affordance for signed-in users at `/dashboard` in `apps/web/src/components/NavBar.tsx`.

**Checkpoint**: `/dashboard` loads for a signed-in user (empty panels), redirects anonymous users, and typechecks.

---

## Phase 3: User Story 1 — Personalized home after signing in (Priority: P1) 🎯 MVP

**Goal**: Signed-in member lands on a personalized home with greeting, primary browse actions, and
home-library context reflecting the national service.

**Independent Test**: Sign in as a member with a home library; confirm greeting (name + type), the
two Browse actions reach `/catalog`, and library hours reflect the member's home library — no
municipality-specific branding.

- [X] T008 [P] [US1] Create `apps/web/src/services/libraryBranchService.ts` implementing `getLibraryById`, `getHomeLibrary(userId)` (reads `users/{uid}.homeLibraryId` then `libraries/{id}`), and `isOpenNow(library, now?)` per `contracts/services.md`.
- [X] T009 [P] [US1] Build `apps/web/src/components/dashboard/WelcomeBanner.tsx` — greeting with Auth `displayName` + `memberType` (fallback "Member"), copy from `dashboardStrings` (FR-001).
- [X] T010 [P] [US1] Build `apps/web/src/components/dashboard/BrowseActions.tsx` — Browse eBooks and Browse Physical Books cards linking to `/catalog` (with type filters), each reachable in one interaction (FR-004).
- [X] T011 [P] [US1] Build `apps/web/src/components/dashboard/LibraryHours.tsx` — shows home-library name + open/closed (via `isOpenNow`) + hours; when `library` is null render a "choose your home library" prompt (FR-003, FR-016, edge case); own loading/empty state.
- [X] T012 [P] [US1] Build `apps/web/src/components/dashboard/QuickLinks.tsx` — reserve / library rules / user guide / contact support links (FR-007).
- [X] T013 [US1] Wire US1 panels into `apps/web/app/dashboard/page.tsx`: fetch `getHomeLibrary(user.uid)` in an isolated (per-panel) effect, render WelcomeBanner, BrowseActions, LibraryHours, QuickLinks; ensure a failing library fetch does not blank the page (FR-018, FR-002/SC-007 no-municipality copy).
- [X] T014 [US1] Validate US1 scenarios 1–4 in `quickstart.md` (greeting, browse actions, home-library hours, empty-state, anonymous redirect) — passed; typecheck + lint green.

**Checkpoint**: US1 is a demoable MVP on its own.

---

## Phase 4: User Story 2 — Due dates & account alerts (Priority: P2)

**Goal**: Member sees prioritized Due Soon (incl. distinct overdue) and an in-app notifications feed
they can mark read.

**Independent Test**: Sign in as a member with a due-soon item, an overdue item, and unread
notifications; confirm urgency labels, overdue distinction (text/icon not color-only), and that
mark-all-read clears the count and persists on reload.

- [X] T015 [P] [US2] Extend `apps/web/src/services/libraryService.ts` with `getDueSoon(userId, windowDays=3)` — reuse `getAllBorrowRecords` + `getBooksByIds`, classify overdue vs. due-soon and build human-readable label/`daysLeft` per `data-model.md` state transitions (FR-008).
- [X] T016 [P] [US2] Create `apps/web/src/services/notificationService.ts` with `getRecentNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead` (userId-scoped, `createdAt` desc, `limit`) per `contracts/services.md` (FR-009/010/011).
- [X] T017 [P] [US2] Build `apps/web/src/components/dashboard/DueSoonPanel.tsx` — bounded list with urgency label + non-color-only overdue distinction, "View All →" to `/account`; loading/empty states (FR-008, FR-012, FR-017).
- [X] T018 [P] [US2] Build `apps/web/src/components/dashboard/NotificationsPanel.tsx` — unread count with `aria-live`, per-item + "mark all as read" controls calling the service, bounded list with "View All →"; empty state (FR-009/010/011/012).
- [X] T019 [US2] Wire US2 panels into `apps/web/app/dashboard/page.tsx` with isolated per-panel fetches and optimistic mark-read state kept consistent with the unread count (FR-011, FR-018).
- [X] T020 [US2] Validate US2 scenarios 5–6 in `quickstart.md` (due-soon/overdue labels, mark-all-read persists across reload) — passed; typecheck + lint green.

**Checkpoint**: US1 + US2 function independently.

---

## Phase 5: User Story 3 — Discovery & continue reading (Priority: P3)

**Goal**: Member sees featured borrowable titles and can resume in-progress books at their last page.

**Independent Test**: Sign in as a member with in-progress books; confirm Featured shows
title/author/availability (unavailable state when 0 copies) and Continue Reading shows progress and
resumes at the stored page.

- [X] T021 [P] [US3] Extend `apps/web/src/services/libraryService.ts` with `getFeaturedBooks(max)` — `type==ebook` & `featured==true` with `limit`, fallback to recent eBooks when none flagged; never throws on empty (FR-013, research R5).
- [X] T022 [P] [US3] Create `apps/web/src/services/readingProgressService.ts` with `getContinueReading(userId, max)` — `readingProgress` ordered by `updatedAt` desc + book join, drop unresolvable books (FR-014, contracts/services.md).
- [X] T023 [P] [US3] Build `apps/web/src/components/dashboard/FeaturedRow.tsx` reusing existing `BookCard`; show unavailable state instead of a borrow action when `availableCopies === 0`; "View All →" to `/catalog` (FR-013/015/012).
- [X] T024 [P] [US3] Build `apps/web/src/components/dashboard/ContinueReading.tsx` — progress "page X of Y" and a resume link into the existing reader (`PdfReader`/`/catalog/[id]`) at `currentPage`; empty state (FR-014, FR-012).
- [X] T025 [US3] Wire US3 panels into `apps/web/app/dashboard/page.tsx` with isolated per-panel fetches (FR-018).
- [X] T026 [US3] Validate US3 scenarios 7–8 in `quickstart.md` (featured availability/unavailable, continue-reading resume) — passed; typecheck + lint green.

**Checkpoint**: All three stories function independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T027 Enforce reader privacy: author/verify Firestore security rules restricting `borrowRecords`, `notifications`, `readingProgress` to `resource.data.userId == request.auth.uid`, `users/{uid}` to owner, `libraries` read-only to signed-in, per `contracts/firestore.md`; confirm cross-user read is rejected (FR-020, SC — quickstart scenario 11). **Gate: required before "done".**
- [X] T028 Add required Firestore composite indexes (`notifications` userId+createdAt desc, `readingProgress` userId+updatedAt desc, `books` type+featured) to the project's index config; deploy/verify (contracts/firestore.md).
- [X] T029 [P] Accessibility pass on `/dashboard` (quickstart scenario 10) — WCAG 2.1 AA, Lighthouse Accessibility 100, no critical violations (FR-017, SC-005). Sub-tasks T029a–T029h all complete.

  **Static structural checks (verifiable without a browser):**
  - [X] T029a Semantic landmarks present: `<html lang="en">` (`apps/web/app/layout.tsx`), `<main>`/`<aside>` (`apps/web/app/dashboard/page.tsx`), `<nav>` (`NavBar.tsx`), each panel a `<section aria-label>`. **Verified.**
  - [X] T029b Unread count announced: `aria-live="polite"` + `.sr-only` label in `apps/web/src/components/dashboard/NotificationsPanel.tsx`. **Verified.**
  - [X] T029c Status not conveyed by color alone: urgency pills pair an icon (`::before` ⚠/⏰) + text label in `globals.css` + `DueSoonPanel.tsx`; mobile pills/status have `accessibilityLabel`. **Verified.**
  - [X] T029d Visible keyboard focus: `.dash-grid a:focus-visible / button:focus-visible` outline in `globals.css`. **Verified.**
  - [X] T029e Images have alt text: covers use `alt={book.title}` (`ContinueReading.tsx`, `BookCard.tsx`). **Verified.**
  - [X] T029f **Fixed color contrast** (two tokens in `packages/theme/src/palette.ts`): (1) `--muted` `#8B96AD` (≈2.97:1) → `#6B7488` (≈4.7:1) for small gray text (`.book-author`, `.due-date`, `.continue-page`, `.notif-time`, `.panel-empty`); (2) `--success` `#16A34A` (≈3.3:1) → `#0E7A38` (≈5.4:1) for small green status text (`.avail-ok` "Available Now", `.badge-physical`, `.hours-status.open`) — this was the element Lighthouse flagged on `/`. `--ink-soft` (~8:1) and `--danger` (~5.6:1) already passed.

  **Live checks (require a running browser / device):**
  - [X] T029g Automated checker run (Lighthouse): **Accessibility 100** after the contrast-token fixes (T029f). No critical/serious violations remaining.
  - [X] T029h Keyboard-only walkthrough + mobile screen-reader / font-scaling pass — verified good.
- [X] T030 [P] Resilience/low-bandwidth check (quickstart scenario 9 + SC-004). Code-verified (7 independent per-panel `.catch` handlers) **and** confirmed live: missing-branch fallback isolates to the Library Hours panel while the rest renders, and content stays readable under a Slow-3G throttle with no unusable blank state (FR-018, FR-021).
- [X] T031 [P] Nationwide/i18n review (FR-002/019, SC-007). **Verified:** no municipality-specific copy in shipped app code (grep for "Binangonan"/"residents" → none); dashboard copy externalized (8 web dashboard components + 5 mobile organisms import `dashboardStrings`). Longer-text layout tolerance is a quick visual confirm during T029g.
- [X] T032 Final full-feature validation: all 11 `quickstart.md` scenarios pass end-to-end (seeded via `functions/scripts/seed-dashboard.js`); `pnpm typecheck` green; `pnpm lint` clean apart from the known monorepo-baseline noise.

---

## Phase 7: Mobile Parity (Expo app — same dashboard UI/UX)

**Added by follow-up request "do the same UI/UX to the mobile as well".** Mirrors the web
dashboard on the Expo app (repo-root `src/`, atomic-design + React Native Paper), reusing the
same Firestore collections. Mobile keeps its own local types (`src/types/library.ts`) and inline
copy (house style) rather than the web's `@elibrary/types` / `dashboardStrings`.

- [X] T033 Extend `src/types/library.ts` with `Library`, `LibraryHours`, `AppNotification`, `NotificationCategory`, `ReadingProgress`, `ReadingProgressEntry`, `MemberType`, `UserProfile`, `DueSoonEntry` (firebase `Timestamp`-based mirror of the web types).
- [X] T034 [P] Add `getDueSoon(userId, windowDays=3)` and `getFeaturedBooks(max)` to `src/services/firestore/libraryService.ts` (reuse `getAllBorrowRecords`/`getBooksByIds`; featured fallback).
- [X] T035 [P] Create `src/services/firestore/libraryBranchService.ts` (`getLibraryById`, `getHomeLibrary`, `getMemberType`, `isOpenNow`).
- [X] T036 [P] Create `src/services/firestore/notificationFeedService.ts` (`getRecentNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`).
- [X] T037 [P] Create `src/services/firestore/readingProgressService.ts` (`getContinueReading`).
- [X] T038 [P] Build organism `src/components/organisms/DueSoonSection.tsx` (urgency pill via icon+text, not color-only).
- [X] T039 [P] Build organism `src/components/organisms/NotificationsSection.tsx` (unread count, mark-all + tap-to-read).
- [X] T040 [P] Build organism `src/components/organisms/LibraryHoursSection.tsx` (open/closed + hours, or choose-library prompt).
- [X] T041 [P] Build organism `src/components/organisms/QuickLinksSection.tsx` (reserve/rules/guide/contact).
- [X] T042 Update `src/components/organisms/HomeHeader.tsx` — member-type in eyebrow pill + real unread badge on the bell.
- [X] T043 Extend `src/hooks/useHomeLibraryData.ts` — load member type, home library, due-soon, notifications + unread independently (per-panel resilience) and expose mark-read handlers.
- [X] T044 Wire new sections into `src/components/templates/HomeTemplate.tsx` and `src/screens/HomeScreen.tsx`; update `organisms/index.ts` barrel.
- [X] T045 Validate: `pnpm typecheck` (mobile + web) green; lint of changed mobile files clean. **[Runtime device/simulator walkthrough still pending — requires live Firebase + Expo run.]**

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phases 3–5)** → **Polish (Phase 6)**.
- **Phase 2 blocks everything**: T003 (types) is a hard prerequisite for all service/component tasks; T006 (route shell) is required before any panel can be wired (T013/T019/T025).
- **User story independence**: US1, US2, US3 touch disjoint service files and disjoint component files, so their phases can be done in any order after Phase 2. They only converge on `app/dashboard/page.tsx` wiring tasks (T013, T019, T025), which are sequential relative to each other (same file) but independent in logic.
- **Polish (Phase 6)** depends on the panels existing; T027 (security rules) is a required completion gate.

### Story completion order (by priority)
1. **US1 (P1)** — MVP: T008–T014
2. **US2 (P2)** — T015–T020
3. **US3 (P3)** — T021–T026

## Parallel Execution Examples

- **Phase 2**: T005 (globals.css) can run parallel to T004 (strings). T003 must land first.
- **US1**: T008, T009, T010, T011, T012 are all `[P]` (distinct files) → build concurrently, then T013 wires them.
- **US2**: T015, T016, T017, T018 are all `[P]` → build concurrently, then T019 wires them.
- **US3**: T021, T022, T023, T024 are all `[P]` → build concurrently, then T025 wires them.
- **Polish**: T029, T030, T031 are all `[P]` (independent review dimensions).

## Implementation Strategy

- **MVP = Phase 1 + Phase 2 + Phase 3 (US1)**: a personalized, nationwide, guarded landing with
  browse actions and home-library context — independently demoable.
- **Incremental delivery**: add US2 (alerts) then US3 (discovery); each is a self-contained,
  shippable increment behind the same route.
- **Do not skip T027** (security rules) — it is the Principle IV privacy gate and a completion
  requirement regardless of which stories ship.
