# Technical Architecture Brief — Aklatan+

**Companion to**: Project Proposal (`01-project-proposal.md`)
**Date**: 2026-07-06
**Audience**: Technical reviewers / IT evaluators
**Status**: Reflects the current working build

> This brief describes the architecture as it exists today, plus the additions
> required for a nationwide pilot. It is written for evaluators; it is not a
> configuration guide.

---

## 1. Overview

Aklatan+ is a **cross-platform application** sharing one design system and one cloud
backend across web and mobile. It is organized as a single monorepo so that types,
theme, and domain logic stay consistent between platforms.

```
┌──────────────┐     ┌──────────────┐
│  Web (Next.js│     │ Mobile (Expo │
│  15, React 19)│     │ RN 0.81)     │
└──────┬───────┘     └──────┬───────┘
       │  shared: @elibrary/types, @elibrary/theme
       └──────────┬─────────┘
                  │  Firebase client SDK
        ┌─────────▼──────────┐
        │  Firebase platform  │
        │  • Authentication   │
        │  • Cloud Firestore  │
        │  • Cloud Functions  │
        │  • Cloud Messaging  │
        └─────────────────────┘
```

## 2. Technology stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Web | Next.js 15 (App Router), React 19, TypeScript | Server-rendered + client components |
| Mobile | Expo 54, React Native 0.81, React Navigation 7, React Native Paper | iOS + Android from one codebase |
| Shared | `@elibrary/types`, `@elibrary/theme` | Single source of truth for domain types and design tokens |
| Auth | Firebase Authentication | Email/password today; extensible to SSO/OAuth |
| Database | Cloud Firestore | Managed, horizontally scalable document store |
| Serverless | Firebase Cloud Functions | Notifications and server-side tasks |
| Messaging | Expo / Cloud push notifications | Due-date and availability alerts |
| Language | TypeScript (strict) | Type safety across the whole stack |
| Tooling | pnpm workspaces | Monorepo dependency management |

**Design note**: there is no bespoke API server on the critical path. The apps use the
Firebase client SDK directly, which reduces infrastructure to operate and maintain —
a deliberate choice serving the sustainability principle.

## 3. Repository structure

```
apps/
  web/        Next.js web application
  mobile/     Expo mobile application (primary mobile code also under repo-root src/)
packages/
  types/      Shared TypeScript domain types
  theme/      Shared color palette + gradients (national flag colors)
  ui/         Shared component library
functions/    Firebase Cloud Functions
firestore.rules          Security rules (reader-privacy enforcement)
firestore.indexes.json   Query indexes
```

## 4. Data model (dashboard-relevant)

| Collection | Purpose | Ownership / access |
|------------|---------|--------------------|
| `books` | Catalog: title, author, type (ebook/physical), copies, cover, `featured` | Public read; admin write |
| `borrowRecords` | Active/historical loans with due dates | Owner-only |
| `users` | Member profile: `homeLibraryId`, `memberType`, push token | Owner-only |
| `libraries` | Participating branches: name, region, hours, contact | Read for signed-in members; admin write |
| `notifications` | In-app account event feed | Owner-only |
| `readingProgress` | Continue-reading resume points | Owner-only |

_(Field-level detail: `specs/001-user-landing-page/data-model.md`.)_

The **home-library affiliation** (`users.homeLibraryId` → `libraries/{id}`) is what makes
one nationwide platform present a locally-relevant experience.

## 5. Security & privacy (Principle IV)

Reader privacy is treated as an institutional obligation, enforced at the data layer —
not merely in the client:

- **Owner-only access** — `borrowRecords`, `notifications`, `readingProgress`, and the
  member profile are readable/writable only by their authenticated owner, enforced by
  Firestore security rules (`firestore.rules`).
- **Least privilege** — notification updates are constrained to marking items read; no
  cross-user or arbitrary-field writes.
- **Data minimization** — only the personal data required for the service is collected.
- **In transit & at rest** — traffic is encrypted (TLS); the managed datastore encrypts
  data at rest.
- **Confidentiality of reading history** — what a member borrows and reads is private by
  default.
- **Content licensing** — the catalog is public to browse, but only appropriately
  licensed content is made readable; no feature enables unauthorized redistribution.

## 6. Accessibility & inclusivity (Principles I & II)

- **WCAG 2.1 AA** as the baseline for the member experience.
- **Keyboard operable** with visible focus indicators (web); screen-reader labels and
  `aria-live` announcements for dynamic counts.
- **Status never by color alone** — urgency (e.g. overdue vs. due-soon) is conveyed with
  icons and text, not color only.
- **Low-cost devices & low bandwidth** — the interface degrades gracefully; each
  dashboard panel loads independently so one slow or failing data source never blanks the
  screen.
- **Multi-language-ready** — user-facing copy is centralized (web) so a locale layer can
  be added without reworking the UI.

## 7. Resilience & performance

- **Per-panel isolation** — dashboard sections fetch independently; failures are contained
  and show a graceful fallback or empty state instead of an error page.
- **Bounded queries** — lists are capped with indexed queries (`firestore.indexes.json`)
  and "view all" links, keeping initial load lean.
- **Managed scaling** — Firestore and Cloud Functions scale with demand without the team
  operating servers.

## 8. Nationwide scalability

- **Multi-library by design** — the `libraries` collection and home-library affiliation
  support many participating branches without partitioning the national digital catalog.
- **Stateless clients + managed backend** — capacity grows with the managed platform;
  there is no single app server to size.
- **Shared design system** — new surfaces are added once and inherited by both platforms.

## 9. Integration & migration

- Aklatan+ is the **national member-facing platform and the successor to the elib.gov.ph
  portal** — but it is **not** each local library's internal system of record. Participating
  libraries keep their existing catalog/ILS.
- **Legacy portal migration**: the eLib's existing holdings, digitized content, and catalog
  data are migrated into Aklatan+ (or federated during a transition window) so nothing is
  lost when the aging portal is retired. Migration scope/mechanism is planned with the
  NLP/consortium.
- **Per-library integration** is via **data sharing** (catalog + membership) under
  agreement; the exact mechanism (export/feed/API) is a pilot deliverable to be agreed per
  library.
- No migration of any *local library's* system of record is required to begin.

## 10. Quality & operations

- **TypeScript strict** across the codebase; type checks run for both apps.
- **Version-controlled infrastructure** — security rules and indexes live in the repo.
- **Specification-driven** — features are specified, planned, and tracked
  (`specs/001-user-landing-page/`) before implementation.

## 11. Known gaps to close for the pilot

- Notification-feed generation and reading-progress persistence to be wired to live data
  sources (the dashboard already consumes them).
- Data-sharing integration per participating library.
- Formal accessibility audit (automated + manual) and a security review sign-off.
- Production environment hardening and monitoring.

_(These are tracked as explicit gates; see `03-roadmap-and-budget.md`.)_
