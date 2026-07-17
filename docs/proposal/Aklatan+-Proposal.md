# Aklatan+ — Proposal for Guidance & Partnership

**A Hybrid Community Library System that helps public libraries modernize by integrating
traditional library operations with digital library technology — designed to complement
existing services and preserve the vital role of physical libraries.**

**Prepared for**: The National Library of the Philippines (NLP)
**Prepared by**: Martin Jaycy Halum — Software Developer, Rizal (10+ years, mobile & web)
**Contact**: martinjaycyhalum@gmail.com · 0976-394-8909
**Date**: 2026-07-16
**Status**: Concept submitted for guidance & feedback — not a funding request

> Figures marked _[indicative]_ are placeholders for planning discussion only; they are not
> quotations.

---

## 1. The opportunity

Millions of students, teachers, parents, and lifelong learners depend on public libraries,
yet access is limited by:

- **Distance and hours** — a reader far from a branch, or working during opening hours, is
  effectively cut off from the collection.
- **Physical scarcity** — a single copy serves one reader at a time; popular titles have
  long waits.
- **Fragmented experience** — discovery, borrowing, reading, and due-date reminders live in
  different places (or nowhere).
- **Uneven connectivity and devices** — solutions that assume fast internet and modern
  hardware exclude the very people public libraries exist to serve.

The gap is not content — the country already owns it — it is **reach and convenience**.
Aklatan+ unifies physical and digital collections in one place a member can reach on the web
and on their phone, **while preserving and strengthening the role of physical libraries**.
Local libraries keep full ownership of their collections and their readers.

## 2. Our posture: complement, not replace

Aklatan+ is offered as a **practical, sustainable contribution** to public library
modernization — **not** a replacement for the National Library, its partner institutions, or
existing initiatives. It is built to **complement existing library systems** and to **align
with the National Library's standards and long-term direction**. The concept was first
presented to a local government unit as an enhancement to its e-library initiative; that
experience motivated seeking the National Library's guidance to ensure alignment with
national standards.

In spirit, Aklatan+ carries forward the vision of the landmark **2004 Philippine eLib**
project — access to information for life-long learning, enriched local digital content, and
a nationwide library network (see §7) — and aims to help realize that vision with today's
technology, in cooperation with the institutions that have long advanced it.

## 3. What Aklatan+ offers

- **Unified management** of physical and digital library collections.
- **Mobile and web access** for library patrons, with a **home-library** affiliation so a
  national platform still feels local.
- **Secure digital borrowing** of eBooks and learning materials — with **in-app reading**;
  physical-book reservation for pickup at a member's home library.
- **A personalized dashboard** — continue-reading progress, items due soon (with clear
  overdue indicators), and in-app notifications.
- **Automated notifications** for due dates and material availability.
- **Borrowing history and account management.**
- **Library analytics and administrative reporting.**
- A **scalable architecture** adaptable by public libraries, schools, and local government
  units.

### The "nationwide, still local" model

National digital content is common to all members, while a lightweight **home-library**
affiliation keeps the experience rooted in each reader's local branch. This is the core
design decision that lets one platform serve the whole country without erasing local
libraries.

## 4. Where it stands today — not a paper concept

A working cross-platform build already exists: a web app and a mobile app sharing one design
system, backed by managed cloud infrastructure. The member dashboard — personalized
greeting, featured titles, continue-reading, due-soon alerts, in-app notifications, and
home-library hours — is built and running on both platforms today. This proposal seeks
endorsement to move from build to **supervised pilot**, not funding for an idea on paper.

## 5. Guiding principles (governance)

Every design and development decision is bound by five non-negotiable principles:

1. **Accessibility First** — WCAG 2.1 AA baseline; usable on low-cost devices and poor
   connections.
2. **Inclusivity for All** — plain language, multi-language-ready, no assumed technical
   skill.
3. **Purposeful Innovation** — technology (including AI) only when it serves a real,
   demonstrated need; start simple.
4. **Security & Privacy by Design** — minimal data, encryption, least-privilege, and the
   confidentiality of what people read treated as non-negotiable.
5. **Community Service & Sustainability** — enhance, not replace; respect intellectual
   property; remain affordable and maintainable for future generations.

## 6. Scope

### In scope (initial release)

Member accounts and authentication · catalog browse/search across eBooks and physical
titles · eBook borrowing and in-app reading · physical-book reservation · personalized
member dashboard · home-library affiliation and branch information · in-app and push
notifications.

### Out of scope (initial release)

Replacing or migrating any library's existing catalog/ILS system of record · automated
content digitization or rights clearance · administrative/librarian back-office tooling
beyond what a pilot requires · payment or fines processing.

### Assumptions & dependencies

Participating libraries can provide catalog and membership data under a data-sharing
agreement · each member is associated with one home library · content made available
digitally is appropriately licensed by the library.

## 7. Relationship to the Philippine eLib (elib.gov.ph)

> Historical facts are drawn from the eLib project's own documentation and independently
> cross-checked against elib.gov.ph and web.nlp.gov.ph on 2026-07-14. Aklatan+ is framed as a
> **modern spiritual successor** — carrying forward the eLib's 2004 vision, not replacing it.

The **Philippine eLib** is a collaborative national digital library project operated by five
partner institutions — **NLP, UP, DOST, DA, and CHED** — hosted at the U.P. Diliman
University Library, launched via a **MOA signed February 4, 2004** with a **PhP
166,770,000.00** one-year implementation budget. It is primarily a **scholarly discovery
portal and union catalog**: search, subject browsing, a "book cart," and registration. Its
lending model is to **reserve/request materials for physical pickup** — it has **no in-app
eReader**.

| Dimension | Philippine eLib | Aklatan+ |
|-----------|-----------------|----------|
| Primary purpose | National union catalog + scholarly discovery | Everyday borrow / return / read experience for the public |
| Primary audience | Researchers, students, academics | Students, teachers, parents, general community |
| Lending model | Reserve/request for physical pickup | In-app eBook borrowing **and** physical reservation |
| In-app eReader | None | Yes — read and resume in-app |
| Platforms | Web portal | Web + native mobile (iOS/Android), shared design system |
| Personalization | Registration, saved selections | Home-library affiliation, reading progress, due-soon alerts |
| Accessibility | Adjustable text size | WCAG 2.1 AA baseline |
| Local-library context | National/partner-agency oriented | Per-branch home-library hours & availability |

Aklatan+ re-commits to the eLib's founding objectives — life-long learning access, enriched
local content, a nationwide library network — and adds what the legacy portal lacks:
in-app borrowing and reading, native mobile reach, and an everyday account experience. It
aims to **align and interoperate** with the eLib's collections and partner network wherever
the National Library directs, respecting and complementing existing investment rather than
duplicating it. _(Full comparison, including honest limitations and unverified items to
confirm with the NLP: companion document `04-comparison-elib-gov-ph.md`.)_

## 8. Technical architecture (brief)

Aklatan+ is a **cross-platform application** sharing one design system and one cloud backend
across web and mobile, organized as a single monorepo.

| Layer | Technology |
|-------|-----------|
| Web | Next.js 15 (App Router), React 19, TypeScript |
| Mobile | Expo 54, React Native 0.81, React Navigation 7, React Native Paper |
| Shared | `@elibrary/types`, `@elibrary/theme` — one source of truth for domain types and design tokens |
| Auth | Firebase Authentication (email/password today; extensible to SSO/OAuth) |
| Database | Cloud Firestore (managed, horizontally scalable) |
| Serverless | Firebase Cloud Functions (notifications, server-side tasks) |
| Messaging | Expo / Cloud push notifications |

There is no bespoke API server on the critical path — the apps use the Firebase client SDK
directly, reducing infrastructure to operate and maintain, a deliberate choice serving the
sustainability principle.

**Security & privacy** — reader privacy is enforced at the data layer, not merely in the
client: owner-only access to borrow records, notifications, reading progress, and profile
(via Firestore security rules); least-privilege writes; data minimization; encryption in
transit and at rest; only appropriately licensed content is surfaced.

**Accessibility** — WCAG 2.1 AA baseline; keyboard-operable with visible focus (web);
screen-reader labels and live-region announcements; status never conveyed by color alone;
graceful degradation on low-cost devices and low bandwidth (each dashboard panel loads
independently so one slow source never blanks the screen); user-facing copy centralized for
future localization.

**Integration** — Aklatan+ complements existing library systems; it is not each library's
system of record. Participating libraries keep their existing catalog/ILS. Per-library
integration is via data sharing (catalog + membership) under agreement — the exact mechanism
is a pilot deliverable agreed per library. No migration is required to begin.

**Known gaps to close for the pilot** — notification-feed generation and reading-progress
persistence wired to live data sources; data-sharing integration per library; formal
accessibility audit and security review sign-off; production hardening and monitoring.
_(Full brief: companion document `02-technical-architecture.md`.)_

## 9. Implementation roadmap

Delivery is **phased and incremental**: each phase produces something demonstrable and
independently valuable, so the National Library can review and decide at each gate before
committing further.

| Phase | Name | Duration _[indicative]_ | Primary outcome | Exit gate |
|-------|------|--------------------------|------------------|-----------|
| 0 | Endorsement & agreements | 2–4 weeks | Data-sharing agreement, point of contact, success metrics agreed | Signed agreement |
| 1 | Pilot readiness | 4–6 weeks | Live data wiring, security review, accessibility audit, production hardening | Security & a11y sign-off |
| 2 | Supervised pilot | 8–12 weeks | _[N]_ participating libraries live with real members | Pilot metrics reviewed |
| 3 | Evaluation & iteration | 3–4 weeks | Findings, fixes, rollout recommendation | Go/no-go decision |
| 4 | Phased nationwide rollout | ongoing | Onboard libraries in waves | Each wave stable |

**Success metrics** (baselined during the pilot): first-borrow success rate, time to resume
an in-progress book, WCAG 2.1 AA conformance, change in due-date-related support requests,
usability on low-bandwidth connections, and core-flow availability.

**Indicative cost structure** — one-time pilot costs (integration engineering, data
services, accessibility audit, security review, production setup, enablement) and recurring
operating costs (managed cloud platform, storage/bandwidth, maintenance, monitoring) are
usage-based, so cost **scales with adoption** rather than requiring large fixed capacity
up front. All amounts are placeholders pending real quotations. _(Full breakdown: companion
document `03-roadmap-and-budget.md`.)_

**Sustainability** — affordable to operate (managed cloud, no server fleet), maintainable by
library staff (standard, documented stack), no lock-in of library data (the library owns
catalog and reader data; Aklatan+ is a custodian), with a handover plan (documentation,
runbooks, training) before nationwide rollout.

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Perceived as replacing existing libraries/initiatives | Explicitly positioned to complement, not replace; local libraries keep ownership and branding |
| Duplicating existing national efforts | NLP guidance sought early to align with, and build on, existing initiatives |
| Reader privacy concerns | Privacy by design; owner-only access enforced by security rules |
| Content licensing / copyright | Only licensed content surfaced; no unauthorized redistribution |
| Low-connectivity exclusion | Accessibility & low-bandwidth resilience are release requirements |
| Long-term cost/sustainability | Managed cloud with usage-based cost |
| Adoption | Guidance-led pilot with a few libraries before wider rollout |

## 11. A low-risk path forward

Guidance is the ask today; adoption, if the National Library ever wants it, is deliberately
structured to be a small, reversible step rather than a large commitment:

- **Nothing to build from scratch** — a working cross-platform build already exists; this is
  a review of a working product, not a bet on a roadmap.
- **No procurement decision required to start** — a guidance-led pilot can begin under an
  informal collaboration or data-sharing agreement.
- **No lock-in** — participating libraries keep their existing catalog/ILS as the system of
  record; stopping the pilot leaves no system to unwind.
- **Reversible and observable** — each phase ends in a defined exit gate the NLP reviews
  before the next phase begins.
- **The National Library sets the terms** — scope, data-sharing conditions, branding,
  success metrics, and (if relevant) funding/IP terms are decided by the NLP.
- **Low ongoing cost if it succeeds** — usage-based cloud model means costs scale with
  actual adoption.

## 12. The ask

Respectfully, the developer seeks the **National Library's guidance, feedback, and
recommendations**:

1. **Feedback and recommendations** on how Aklatan+ can best align with the NLP's standards,
   existing initiatives (including the Philippine eLib), and long-term direction for public
   library services.
2. The opportunity to **present the concept** and provide the complete proposal and
   supporting materials, as this document does.
3. If the direction is found worthwhile, guidance on a **small, supervised pilot** with
   interested libraries — including any data-sharing terms and a point of contact.
4. Should the National Library see fit, the developer remains open to discussing **funding,
   sponsorship, or formal adoption** of Aklatan+ for a pilot or wider rollout. This is
   offered, not requested — the developer is glad to proceed on guidance alone, and any such
   arrangement would be entirely on terms the National Library considers appropriate,
   covering scope, cost, intellectual property, and long-term support.

The aim is to learn from the National Library's expertise and contribute, in a modest and
practical way, to the modernization of library services across the country. Thank you for
your time, and for your continued work strengthening library services and literacy across
the Philippines.

Respectfully,
**Martin Jaycy Halum**
Software Developer, Rizal · martinjaycyhalum@gmail.com · 0976-394-8909

---

## Appendix — companion documents

This single-file proposal condenses the full submission package. Fuller detail on any
section is available on request:

| # | Document | Purpose |
|---|----------|---------|
| 02 | Technical Architecture Brief | Full stack, data model, security, accessibility, scale detail |
| 03 | Implementation Roadmap & Budget | Full phased plan, metrics, cost breakdown, resourcing |
| 04 | Relationship to the Philippine eLib | Full historical comparison and honest limitations |
| — | Constitution (governing principles) | `.specify/memory/constitution.md` |
| — | Member dashboard specification | `specs/001-user-landing-page/spec.md` |
