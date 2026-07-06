# Implementation Plan: Member Landing Dashboard (Nationwide)

**Branch**: `001-user-landing-page` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-user-landing-page/spec.md`

## Summary

Deliver the authenticated **member home dashboard** for the Next.js web app: a personalized
landing surface that greets the signed-in member, shows their loans / due-soon / reading
progress, surfaces featured titles and continue-reading, and provides an in-app notifications
feed and quick links — all scoped to a **nationwide** service rather than a single
municipality. "Nationwide" is realized by introducing a lightweight **Home Library** (branch)
concept: each member is affiliated with one library that supplies branch-specific context
(service hours, physical-collection context), while national digital content is common to all.

Technical approach: build the dashboard as a new authenticated route in `apps/web` (Next.js 15
App Router, React 19 client components) consuming Firestore directly via the existing
service-layer pattern in `apps/web/src/services`. Reuse the shared `@elibrary/theme` tokens
(already nationally branded) and the existing `globals.css` design system. Extend
`@elibrary/types` with `Library`, `Notification`, and `ReadingProgress` types and add matching
service functions and Firestore collections. No backend REST layer is introduced — the app's
established pattern is the client Firestore SDK.

## Technical Context

**Language/Version**: TypeScript ~5.9, React 19.1, Next.js 15.3.4 (App Router, Turbopack)

**Primary Dependencies**: `firebase` ^12.11 (Auth + Firestore client SDK), shared workspace
packages `@elibrary/theme`, `@elibrary/types`, `@elibrary/ui`; `next/font` (Inter + Plus Jakarta
Sans). No new runtime dependency is expected.

**Storage**: Cloud Firestore. Existing collections: `books`, `borrowRecords`, `users`. New
collections this feature: `libraries`, `notifications` (in-app feed), `readingProgress`. New
field on `users`: `homeLibraryId`. New optional field on `books`: `featured`.

**Testing**: No formal test runner is configured in `apps/web` today (scripts: dev/build/start/
typecheck). Validation is via `pnpm --filter @elibrary/web typecheck`, `pnpm lint`, and the
manual scenarios in `quickstart.md`. Tests are OPTIONAL per the spec and not mandated by the
constitution; automated tests are out of scope unless requested.

**Target Platform**: Modern browsers (desktop + mobile web) via `react-native-web`-independent
Next.js web app. Must remain usable on low-cost mobile devices and low bandwidth.

**Project Type**: Web application (front-end only; Firestore-backed, no separate API service).

**Performance Goals**: Dashboard primary content readable on a low-cost mobile device over a
slow (~Slow 3G) connection with no unusable blank state (SC-004); interactive readiness within
standard web expectations. Firestore reads for the dashboard batched/limited to keep initial
load lean.

**Constraints**: WCAG 2.1 AA for the home view including full keyboard operability and
non-color-only status (SC-005); graceful degradation when data cannot be refreshed (last-known
state, never raw errors); reader privacy — only the authenticated owner sees their account data
(FR-020). No municipality-specific branding on the default experience (SC-007).

**Scale/Scope**: One new authenticated route with ~6 dashboard panels, ~3 new domain types,
~4–6 new service functions, and 3 new Firestore collections. Nationwide member base (design for
many participating libraries; per-member reads bounded by list caps in FR-012).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Accessibility First | Home view targets WCAG 2.1 AA; keyboard-operable; status not color-only; works on low-cost/low-bandwidth devices. | ✅ Encoded in FR-017/FR-018, SC-004/SC-005; design tasks include a11y pass. |
| II. Inclusivity for All | Labels understandable to non-experts; multi-language-capable presentation; empty states guide next action. | ✅ FR-019/FR-021; copy reviewed for plain language; i18n approach in research.md. |
| III. Purposeful Innovation | No new tech unless it serves a demonstrated need; start simple (YAGNI); justify complexity. | ✅ No new dependency; reuse existing service/theme patterns; branch concept is minimal. |
| IV. Security & Privacy by Design | Only the owner sees their account data; minimal personal data; access rules enforced. | ✅ FR-020; per-user Firestore queries keyed on `auth.uid`; security-rules note in research.md. |
| V. Community Service & Sustainability | Enhance not replace; affordable/maintainable; respect content licensing; no lock-in. | ✅ Reuses existing stack (no new infra/cost); home-library concept complements existing branches. |

**Initial gate result**: PASS — no violations; Complexity Tracking not required.

**Post-design re-check (after Phase 1)**: PASS — data model adds three small collections and two
fields, all consistent with existing patterns; no principle regressed. Firestore security-rule
ownership is documented as a required implementation gate (Phase 0 R6). No entries needed in
Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-landing-page/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── services.md      # Service-layer function contracts (client Firestore)
│   ├── firestore.md     # Firestore collection/document schemas + security rules
│   └── ui.md            # Route + component/props/state UI contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
apps/web/                                # Next.js 15 web app (this feature's home)
├── app/
│   └── dashboard/
│       └── page.tsx                      # NEW: authenticated member dashboard route
├── src/
│   ├── components/
│   │   └── dashboard/                    # NEW: dashboard panel components
│   │       ├── WelcomeBanner.tsx
│   │       ├── BrowseActions.tsx
│   │       ├── FeaturedRow.tsx
│   │       ├── ContinueReading.tsx
│   │       ├── NotificationsPanel.tsx
│   │       ├── DueSoonPanel.tsx
│   │       ├── LibraryHours.tsx
│   │       └── QuickLinks.tsx
│   ├── services/
│   │   ├── libraryService.ts             # EXTEND: due-soon/overdue helpers, featured query
│   │   ├── libraryBranchService.ts       # NEW: home-library (branch) reads
│   │   ├── notificationService.ts        # NEW: in-app notifications feed + mark-read
│   │   └── readingProgressService.ts     # NEW: continue-reading progress reads
│   └── context/AuthContext.tsx           # REUSE (unchanged)
└── app/globals.css                       # EXTEND: dashboard layout + panel styles

packages/types/src/index.ts               # EXTEND: Library, Notification, ReadingProgress,
                                          #         + homeLibraryId on user profile shape,
                                          #         + featured?: boolean on Book
```

**Structure Decision**: Web application, front-end only. The dashboard lives entirely in
`apps/web` following the established App-Router-page + `src/services` + `src/components`
pattern. The authenticated home is placed at a dedicated **`/dashboard`** route (signed-in
members are routed here) so the existing `/` can remain the public entry without conflating
public and authenticated concerns — consistent with the spec's Out-of-Scope for the public
landing page. Shared domain types are centralized in `@elibrary/types` so mobile can adopt them
later without duplication.

## Complexity Tracking

> No constitution violations. Section intentionally left empty.
