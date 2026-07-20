# Technical Dossier — Aklatan+

### Architecture · Security · Accessibility · Offline Support · Operational Readiness

*Prepared for technical evaluation by the National Library of the Philippines and partners · 2026-07-20*

---

## Table of contents

1. [Executive summary & scope](#1-executive-summary--scope)
2. [System architecture](#2-system-architecture)
3. [Data model](#3-data-model)
4. [Identity, roles & access control](#4-identity-roles--access-control)
5. [Security & privacy by design](#5-security--privacy-by-design)
6. [Secure eBook delivery](#6-secure-ebook-delivery)
7. [Accessibility](#7-accessibility)
8. [Offline & low-bandwidth support](#8-offline--low-bandwidth-support)
9. [Notifications & scheduled jobs](#9-notifications--scheduled-jobs)
10. [Operational readiness](#10-operational-readiness)
11. [Sustainability, cost & data sovereignty](#11-sustainability-cost--data-sovereignty)
12. [Roadmap & phasing](#12-roadmap--phasing)
13. [Appendix](#13-appendix)

A note on honesty: throughout this dossier, capabilities already implemented are described in the present tense; capabilities not yet built are explicitly labelled **Planned** or **Roadmap**. This is intended to be a document that survives technical scrutiny, not a marketing sheet.

---

## 1. Executive summary & scope

**Aklatan+** is a Hybrid Community Library System delivered as two client applications — a **web console** for library staff and a **mobile app** for readers — over a single **PostgreSQL-based backend**. It manages a unified catalog of physical and digital materials, the full borrow/return lifecycle, secure lending of licensed eBooks, reader notifications, and role-based administration with an audit trail.

The platform is engineered around four principles drawn from its project constitution: **Accessibility First**, **Inclusivity for All**, **Security & Privacy by Design**, and **Community Service & Sustainability**. Its architectural choices — a standard relational database, server-enforced access control, and open export formats — are deliberately made to keep the system **affordable, staff-maintainable, sovereign, and free of vendor lock-in**.

This dossier documents the system as built today and states clearly where hardening work (offline support, CI/CD, automated testing, monitoring, accessibility audit) is planned before or during a wider rollout.

---

## 2. System architecture

### 2.1 High-level shape

Aklatan+ is a **monorepo** managed with the pnpm package manager. It contains two applications and a set of shared packages, all talking to a managed PostgreSQL backend (Supabase) that provides the database, authentication, file storage, and server-side functions.

```
                        ┌──────────────────────────────────────────┐
                        │                 READERS                    │
                        │           Mobile app (patrons)             │
                        │   Expo / React Native · React Navigation   │
                        └───────────────────┬────────────────────────┘
                                            │  HTTPS (JWT)
   ┌───────────────────────┐               │
   │      LIBRARY STAFF     │               │
   │   Web console          │  HTTPS (JWT)  │
   │   Next.js · React      ├───────────────┤
   └───────────────────────┘               │
                                            ▼
             ┌───────────────────────────────────────────────────────┐
             │                  BACKEND  (Supabase)                    │
             │                                                         │
             │   ┌───────────────┐   ┌───────────────────────────┐    │
             │   │  PostgreSQL   │   │  Auth  (email/password,    │    │
             │   │  7 tables     │◄──┤  JWT with role claims)     │    │
             │   │  + RLS        │   └───────────────────────────┘    │
             │   │  + RPCs       │                                     │
             │   │  + triggers   │   ┌───────────────────────────┐    │
             │   │  + pg_cron    │──►│  Edge Functions (Deno)     │    │
             │   └───────┬───────┘   │  privileged, service-role  │    │
             │           │           └─────────────┬─────────────┘    │
             │           │                         │                   │
             │   ┌───────▼───────────────┐  ┌──────▼──────────────┐    │
             │   │ Storage: private      │  │ Expo Push (out-of-  │    │
             │   │ "ebooks" bucket       │  │ band notifications) │    │
             │   └───────────────────────┘  └─────────────────────┘    │
             └───────────────────────────────────────────────────────┘
```

### 2.2 Components

| Layer | Technology | Role |
|---|---|---|
| Web console | **Next.js 15 (App Router) + React 19**, TypeScript | Staff catalog/patron/loan management; branded pdf.js eBook reader |
| Mobile app | **Expo SDK 54 / React Native 0.81 + React 19**, React Navigation v7, react-native-paper | Reader discovery, borrowing, eBook reading, notifications |
| Shared packages | `types` (domain model), `theme`, `ui` | One source of truth for types and styling across both apps |
| Database | **PostgreSQL** (Supabase) | Relational store; Row-Level Security; stored procedures; scheduled jobs |
| Authentication | Supabase Auth | Email/password sign-in; JWTs carrying role/scope claims |
| Server functions | **Edge Functions (Deno)** | Privileged operations under a service-role key |
| File storage | Supabase Storage (private bucket) | eBook files, reachable only via signed URLs |

### 2.3 Why a relational database

The catalog, loans, patrons, and audit records are inherently relational (a loan references a book and a user; availability must never go negative). A standard PostgreSQL database provides:

- **Integrity guarantees** — foreign keys, enums, and CHECK constraints prevent invalid states (e.g. lending a copy that isn't available) at the database level, not just in application code.
- **Sovereignty & portability** — PostgreSQL is open-source and self-hostable; the entire dataset can be exported at any time (see §11).
- **Low total cost of ownership** — a widely-understood database that library or LGU IT staff can operate long-term.

### 2.4 Request flow (example: borrowing a book)

```
Reader taps "Borrow"
      │
      ▼
Mobile app calls borrow_book(book_id, type, due_date)   ── JWT identifies the reader
      │
      ▼
PostgreSQL stored procedure (SECURITY DEFINER):
      │   1. locks the book row (FOR UPDATE)
      │   2. checks available_copies > 0
      │   3. decrements availability
      │   4. inserts a borrow record for auth.uid()   ← borrower is always the caller
      │   (all in one transaction)
      ▼
Returns the new loan; UI updates
```

Because steps 1–4 run in a single locked transaction, two readers cannot both borrow the last copy — a class of bug that client-side "check then write" logic cannot prevent.

---

## 3. Data model

The domain is seven PostgreSQL tables. Every non-trivial field is typed with an enum or constrained; identifiers and relationships are explicit.

```
 libraries ─────────────┐
   id (PK)              │ home_library_id / assigned_*        library_id / region
   name, region         ▼                                          │
   hours (jsonb)     users ──────────┐                             ▼
   contact             id (PK = auth) │ user_id                  books
                       role, status   ▼                            id (PK)
                       member_type  borrow_records                 title, author
                       scope[]        id (PK)                      type (ebook|physical)
                                      book_id ──────────────────►  category
                       user_id        due_date, returned          available_copies
                         │            returned_at                  total_copies
          ┌──────────────┼───────────────┐                        ebook_storage_path
          ▼              ▼               ▼                         cover, featured
   notifications   reading_progress   audit_log
     category        (user_id,          actor_uid, action
     read            book_id) unique    target_type/id
                     current_page       details (jsonb)
```

### 3.1 Tables

| Table | Purpose | Notable rules |
|---|---|---|
| `libraries` | Branches | Region, opening hours (JSON) |
| `users` | Reader/staff profile (1:1 with an auth account) | `role` defaults to `patron`, `status` to `active`; librarian scope via `assigned_library_ids[]` / `assigned_region` |
| `books` | Catalog (physical + digital) | `available_copies >= 0` **and** `<= total_copies` enforced by CHECK constraints |
| `borrow_records` | Loans | Tracks due date, return timestamp, returned flag |
| `notifications` | In-app feed | Category enum: availability / due reminder / return confirm / general |
| `reading_progress` | Resume point per reader per book | Unique on `(user_id, book_id)` |
| `audit_log` | Record of privileged actions | Written only by server-side functions |

### 3.2 Enumerated types

`book_type` (ebook, physical) · `member_type` (Student, Teacher, Parent, Community) · `user_role` (patron, librarian, admin) · `account_status` (active, suspended) · `notification_category` (availability, dueReminder, returnConfirm, general).

### 3.3 Integrity & performance

- **Referential integrity:** foreign keys with cascade rules keep loans, notifications, and progress consistent when a user or book is removed.
- **Availability can never be invalid:** CHECK constraints make negative or over-total availability impossible.
- **Purpose-built indexes** mirror the app's real access patterns (books by library, books by featured/type, loans by user & returned state, loans due-soon, notifications by user & recency, audit log by recency), so common queries stay fast as data grows.
- **ID strategy:** a reader's profile row shares the identity of their authentication account (one-to-one), removing a class of mismatch bugs.

---

## 4. Identity, roles & access control

### 4.1 Authentication

Readers and staff sign in with **email and password** via Supabase Auth. A successful sign-in yields a **JSON Web Token (JWT)**. Sessions are persisted and auto-refreshed (in secure device storage on mobile), so users stay signed in without re-entering credentials, and a changed role can be picked up by refreshing the session.

### 4.2 Authorization model

There are three roles in a strict hierarchy:

```
        admin  ⊇  librarian  ⊇  patron
        (full)   (scoped ops)   (self only)
```

- **patron** — the default for every new account; can act only on their own records.
- **librarian** — manage catalog and patrons **within an assigned scope** (specific libraries and/or a region).
- **admin** — full management across the system.

The authoritative source of a user's role and scope is a **claim embedded in their JWT** (`role`, plus library/region scope). This claim can be **set only by trusted server-side functions**, never by the client. Suspending an account clears its role claim, immediately denying access.

### 4.3 Client-side checks are convenience only

The apps include helper predicates (e.g. "can this user manage inventory?") to show or hide UI. These are **explicitly documented in the code as *not* the security boundary** — they improve the experience but are never trusted for enforcement. Every actual decision is made on the server (see §5).

---

## 5. Security & privacy by design

Aklatan+ treats reader privacy as an institutional obligation: in a library, the confidentiality of what people read is foundational trust. Security is enforced in the database and in server functions, not left to the client.

### 5.1 Row-Level Security (RLS)

Every table has **Row-Level Security enabled**. Policies are evaluated by PostgreSQL on every query using only the trusted JWT claims — they never trust client-supplied identity. Examples of what the policies enforce:

- A reader can read **only their own** loans, notifications, and reading progress.
- The catalog is publicly readable; **writes are limited to staff within scope**.
- The **audit log is admin-read-only** and can never be written by a client.
- **No client can delete** user records.
- A loan can only be moved from *not returned* → *returned*, never the reverse, by its owner.

### 5.2 Column-level protection

Beyond row policies, **column-level grants** restrict which fields a user may change even on their own row. A reader may update only their home library, member type, and notification token — they can **never modify their own role, status, or scope**. This closes the classic "user escalates their own privileges" hole at the database layer.

### 5.3 Privileged operations run server-side

Sensitive actions — assigning roles, changing account status, editing another patron, deleting a book, minting eBook access — are **not performed by the client**. They run in **Edge Functions** that:

1. Execute under a **service-role key that never leaves the server**.
2. **Verify the caller's identity** by validating their JWT server-side (not by trusting an unsigned token).
3. Enforce role and scope guards before acting.
4. Write an **audit-log entry** for accountability.

Notable safeguards: role assignment validates the target role against an allowlist and **refuses to demote the last remaining admin** (preventing accidental lock-out); the borrow/return procedures run as atomic, locked transactions (preventing over-borrowing).

### 5.4 Input validation

Validation is layered: the **database** rejects invalid data via enums, NOT-NULL, foreign keys, and CHECK constraints; **server functions** validate their arguments (e.g. a valid book id, an allowed role) before acting.

### 5.5 Secrets & transport

- All client↔backend traffic is over **HTTPS**.
- The **service-role key is read only inside server functions**, never shipped to a client.
- Environment secrets and native signing artifacts are excluded from version control.

### 5.6 Mapping to the project constitution (Principle IV)

| Constitutional requirement | How it is met |
|---|---|
| Minimum personal data | Profile holds only what lending requires |
| Encrypt in transit | HTTPS everywhere |
| Least-privilege access to reader records | RLS + column grants + scoped roles |
| Auth/authz reviewed before release | Access paths centralized in RLS + Edge Functions |
| Reading history confidential | Owner-only RLS on loans & progress |
| Security events logged for audit | Audit log written by all privileged functions |

### 5.7 Known gaps & remediation (transparent)

| Gap | Risk | Remediation |
|---|---|---|
| Legacy eBook titles not yet migrated to the private store fall back to an older, ungated link | Those specific titles are not access-controlled | **Planned:** migrate all pilot-cluster titles into the private, loan-gated store before full launch; retire the fallback |
| Server functions currently allow permissive cross-origin (CORS) settings | Broad browser origins accepted | **Planned:** restrict to known application origins during hardening |
| Some repository configuration/debug artifacts predate the current backend | Housekeeping/hygiene | **Planned:** cleanup as part of the hardening milestone |

---

## 6. Secure eBook delivery

Lending a licensed eBook must give a reader *temporary, individual* access — never a permanent, shareable copy. Aklatan+ enforces this end-to-end.

### 6.1 How it works

```
Reader opens an eBook
      │
      ▼
App calls get-ebook-url(book_id)
      │
      ▼
Edge Function (service-role):
      │  1. verifies the caller's JWT (who are you?)
      │  2. re-checks an ACTIVE loan exists for this reader + book
      │     (returned = false)  ← authorization the client cannot forge
      │  3. mints a signed URL to the private file, valid for 10 minutes
      ▼
App streams the file via the short-lived URL; link expires shortly after
```

### 6.2 Why this is secure

- The **eBook storage bucket is private** — there are no client read permissions, so the files are unreachable except through a freshly minted signed URL.
- The signing step happens **only after the server re-verifies an active loan** — possession of a book id is not enough.
- Signed URLs are **time-limited (10 minutes)**, so a leaked link expires almost immediately and cannot be redistributed as a permanent copy.
- This directly satisfies the constitutional requirement that **no feature enable unauthorized redistribution of protected works**, giving libraries confidence to lend licensed content.

### 6.3 Reading experience

The web console renders PDFs in a branded pdf.js-based reader with accessible controls; the mobile app reads within the app. Reading position is saved per reader per book so a reader can **resume where they left off**.

### 6.4 Known gap

As noted in §5.7, a small set of **legacy titles** not yet migrated into the private store currently use an older ungated link. Migrating the pilot cluster's titles into the secure store is a **pre-launch task**.

---

## 7. Accessibility

**Target:** the project constitution mandates **WCAG 2.1 AA** as a baseline — sufficient contrast, full keyboard navigation, screen-reader support, and text alternatives — plus usability on low-cost devices and poor connections.

### 7.1 Implemented today

- **Mobile** is built on **react-native-paper**, a component library that provides accessible, platform-consistent primitives (labels, roles, touch targets) out of the box.
- **Web** uses semantic landmarks and ARIA on key surfaces: labelled page sections on the dashboard, alternative text on cover images, decorative icons hidden from assistive tech, a **polite live region** announcing new/unread notifications, and a fully **labelled dialog** for the eBook reader (previous/next page, zoom, fullscreen, close).

### 7.2 Gaps & remediation (transparent)

| Gap | Status | Plan |
|---|---|---|
| No independent WCAG 2.1 AA audit yet | Baseline in place, unverified | **Planned:** formal audit + remediation during hardening |
| No automated accessibility tests in the pipeline | Manual only | **Planned:** add automated a11y checks (e.g. axe) to CI |
| No multi-language / Filipino interface yet | English strings only | **Roadmap:** introduce internationalization; Filipino-language UI (constitution Principle II — Inclusivity) |
| Web has no shared component library | Hand-built components | Ongoing: consolidate accessible patterns; consider a shared UI kit |

Accessibility is treated as a precondition, not an add-on: the constitution's rule is that **no feature ships if it makes an existing accessibility guarantee worse**.

---

## 8. Offline & low-bandwidth support

**Honest current state:** Aklatan+ is today an **online-first** system. This section states plainly what exists and what is planned, because connectivity is uneven across many library communities and the constitution requires core flows to **degrade gracefully** on poor connections.

### 8.1 What exists today

- **Mobile keeps the reader signed in offline** — the authentication session is persisted in secure device storage, so a reader who loses connectivity remains logged in and can reconnect seamlessly.
- Content flows (discovery, borrowing, reading, progress-saving) currently require connectivity. eBooks are streamed via short-lived signed URLs, which by design are not readable fully offline.

### 8.2 What is not yet built

- No offline **content cache** or **downloaded-eBook** reading.
- No offline **write queue** (e.g. saving reading progress while offline and syncing later).
- No web **Progressive Web App / service worker**.

### 8.3 Roadmap

| Capability | Priority | Notes |
|---|---|---|
| Download-for-offline eBook reading (with a licensed, time-boxed local copy) | **High (post-pilot)** | The most-requested offline need; must preserve licensing controls |
| Offline reading-progress queue with sync-on-reconnect | High | Buffer writes locally, reconcile when back online |
| Low-bandwidth mode (lighter assets, deferred images) | Medium | Improves the current online experience on slow links |
| Web PWA / installable offline shell | Medium | Brings offline resilience to the web console |

This is the single largest gap between the current build and the constitutional goal, and it is prioritized accordingly.

---

## 9. Notifications & scheduled jobs

Aklatan+ keeps readers informed through both an in-app feed and mobile push notifications, driven by database logic rather than fragile client timers.

- **Due-date reminders.** A **scheduled database job (pg_cron)** runs daily at **08:00 Manila time**, finds loans due soon, records in-app notifications, and triggers push notifications via the mobile push service.
- **"Book now available" alerts.** When a title's availability rises from zero, a **database trigger** automatically notifies the readers who previously borrowed it — both in the in-app feed and by push.
- **Reliability by design.** The in-app notification is written in the same transaction as the triggering event, so the record always lands even if an out-of-band push cannot be delivered.
- **Push tokens** are registered when a reader signs in and cleared on sign-out, so notifications follow the reader's current device.

---

## 10. Operational readiness

This section is deliberately candid: Aklatan+ has a solid application and data foundation, and a **defined path to production maturity**. Several operational capabilities are pilot-stage and are the first hardening priorities.

### 10.1 In place today

| Area | Status |
|---|---|
| Database schema, security, and business logic as versioned SQL migrations | **In place** — reproducible, reviewable |
| Mobile build & over-the-air update pipeline (EAS) | **In place** |
| Web build (Next.js) | **In place** |
| Server functions deployable via CLI | **In place** |
| Type-checking and linting scripts | **In place** (run on demand) |
| Data export to the **Koha** ILS (interoperability) | **In place** — see §11 |

### 10.2 Gaps & hardening roadmap (transparent)

| Gap | Status | Hardening plan |
|---|---|---|
| **No CI/CD pipeline** | Manual/CLI deploys | **Planned:** automate build, test, and deploy; enforce type-check + lint on every change |
| **No automated tests** for the current backend/apps | Only a legacy test exists | **Planned:** test suite for security rules, server functions, and core flows |
| **No crash/error monitoring** | Not wired up | **Planned:** integrate error and crash reporting (e.g. Sentry) |
| **No committed hosting configuration** | Deploy is manual | **Planned:** codify hosting/environments |
| **Backup/restore & data export** | Managed DB backups + full export available | **Planned:** document and rehearse a restore runbook for the pilot |

### 10.3 Environments & release discipline for the pilot

During the pilot, releases run under a **manual release checklist** (type-check, lint, migration review, smoke test of core flows) with close hands-on support. The hardening milestone converts this checklist into an automated pipeline. This staged approach keeps the pilot safe while the automation is built.

### 10.4 Availability & failure behavior

Core flows are designed to fail safely: the atomic borrow/return procedures prevent inventory corruption under concurrency; notifications degrade to in-app records if push delivery is unavailable; and readers remain signed in through transient connectivity loss.

---

## 11. Sustainability, cost & data sovereignty

Sustainability is a first-class design goal (constitution Principle V): a system libraries cannot afford, staff, or sustain does not serve the community regardless of features.

- **Open, standard database.** PostgreSQL is open-source and self-hostable. There is no proprietary data format and no lock-in; a library or LGU can run and own the stack long-term.
- **Full data portability.** The entire dataset can be exported at any time. Concretely, Aklatan+ ships a **Koha export tool** that produces:
  - a **MARCXML** catalog (standard bibliographic records — MARC 245/100/650, one item record per physical copy), and
  - a **Koha `borrowers` CSV** of member records.
  This is direct, working evidence that the data is **standards-aligned and exportable into the open-source ILS already used across the Philippine public-library community** — a concrete answer to "what happens to our data?"
- **Staff-maintainable.** A widely-understood relational database and standard web/mobile stacks mean the platform can be maintained by ordinary library or government IT staff, not a single vendor.
- **Low total cost of ownership.** Managed backend services keep operating costs modest at pilot scale; the same design self-hosts if an institution prefers full in-house control.
- **Custodian, not owner.** Catalog and reader data belong to the library and its users; Aklatan+ is explicitly a custodian.

---

## 12. Roadmap & phasing

```
  PILOT (now)              HARDENING (next)              INTEGRATION (later)
  ───────────              ────────────────              ───────────────────
  • NCR cluster            • CI/CD + automated tests      • eLib metadata harvest
  • Core lending flows     • Crash/error monitoring         (subject to consortium
  • Secure eBooks          • Offline eBook + sync-queue      data-sharing & licensing)
  • Notifications          • WCAG 2.1 AA audit            • Live ILS interoperability
  • Koha export demo       • Filipino-language UI         • Additional clusters
  • Manual release         • Migrate legacy titles
    checklist              • Restrict CORS; cleanup
```

- **Pilot:** validate the model in the NCR cluster (see Pilot Brief).
- **Hardening:** close the operational and offline gaps documented in §8 and §10; complete the security remediation in §5.7 and the accessibility work in §7.2.
- **Integration:** read-only metadata harvest / broader interoperability is technically feasible and gated on data-sharing agreements and licensing — pursued only with the consortium's and NLP's guidance.

---

## 13. Appendix

### 13.1 Table reference

| Table | Key columns |
|---|---|
| `libraries` | id, name, region, hours, contact |
| `users` | id (=auth id), home_library_id, member_type, role, status, assigned_library_ids[], assigned_region, expo_push_token |
| `books` | id, title, author, type, category, available_copies, total_copies, ebook_storage_path, cover_image, featured, library_id, region |
| `borrow_records` | id, user_id, book_id, type, borrowed_at, due_date, returned_at, returned |
| `notifications` | id, user_id, category, title, body, read, created_at |
| `reading_progress` | id, user_id, book_id, current_page, total_pages, updated_at |
| `audit_log` | id, actor_uid, actor_role, action, target_type, target_id, details, created_at |

### 13.2 Server function inventory

| Function | Purpose |
|---|---|
| `get-ebook-url` | Verify active loan, mint a 10-minute signed URL to a private eBook |
| `assign-role` | Change a user's role within scope; allowlist-validated; protects last admin; audited |
| `set-account-status` | Activate/suspend an account (suspending clears the role claim) |
| `update-patron` | Staff edit of a patron record within scope |
| `delete-book` | Remove a catalog title (privileged, audited) |
| `notify-availability` | Push "now available" alerts to prior borrowers |
| `send-due-reminders` | Daily scheduled due-date reminders |
| `borrow_book` / `return_book` (DB procedures) | Atomic, locked loan open/close |

### 13.3 Glossary

- **JWT** — a signed token proving a user's identity and carrying their role/scope claims.
- **RLS (Row-Level Security)** — database rules that restrict which rows each user can read or write, enforced by PostgreSQL itself.
- **Edge Function** — server-side code running with elevated privileges for operations the client must not perform.
- **Signed URL** — a temporary, expiring link granting time-limited access to a private file.
- **MARCXML / Koha** — a standard bibliographic record format and the open-source ILS widely used by Philippine libraries.
- **ILS** — Integrated Library System (the software libraries use to manage catalogs and lending).
- **pg_cron** — a PostgreSQL scheduler used here for daily reminder jobs.

---

*This dossier reflects the Aklatan+ implementation as of 2026-07-20. Items marked **Planned** or **Roadmap** are not yet built and are prioritized as described. Prepared for collaborative review with the National Library of the Philippines.*
