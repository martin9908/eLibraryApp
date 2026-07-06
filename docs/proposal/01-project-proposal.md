# Project Proposal — Aklatan+

**A Hybrid Community Library System for public library modernization**

**Prepared for**: The National Library of the Philippines (NLP)
**Date**: 2026-07-06
**Version**: 0.1 (concept for guidance & feedback)
**Prepared by**: Martin Jaycy Halum — Software Developer (Rizal); 10+ years building mobile & web applications
**Contact**: martinjaycyhalum@gmail.com · 0976-394-8909

> Figures marked _[indicative]_ (e.g. in the budget) are placeholders to be finalized; they
> are not quotations.

---

## 1. Introduction

Aklatan+ is a **Hybrid Community Library System** (web and mobile) whose purpose is to help
public libraries **modernize their services by seamlessly integrating traditional library
operations with digital library technologies**. It makes the country's learning resources
easier to discover, borrow, and read for students, teachers, parents, and the wider
community, **while preserving and strengthening the role of physical libraries** — local
libraries retain ownership of their collections, their catalog data, and their relationship
with readers.

**Posture — complement and align, not replace.** Aklatan+ is offered as a practical,
sustainable contribution to public library modernization. It is designed to **complement
existing library systems and initiatives** and to **align with the National Library's
standards and long-term direction**. The concept was initially presented to a local
government unit as an enhancement to its e-library initiative; while it was not pursued at
the local level, that experience motivated further development and a respectful request for
the **National Library's guidance** to ensure alignment with national standards and the
vision for public library modernization in the Philippines.

**A note on heritage.** In spirit, Aklatan+ carries forward the vision of the landmark 2004
**Philippine eLib** project — access to information for life-long learning, enriched local
digital content, and a nationwide library network (see `04-comparison-elib-gov-ph.md`). The
intent is to help realize that enduring vision with modern technology, **in cooperation with
the institutions that have long advanced it** — not to supersede them.

This proposal describes the problem, the proposed solution, its scope, the value it
delivers, how it is governed, and the guidance sought from the National Library.

## 2. Background & problem statement

Public libraries are trusted, universal institutions, but access to their resources is
constrained by:

- **Distance and hours** — a reader far from a branch, or one who works during opening
  hours, is effectively cut off from the collection.
- **Physical scarcity** — a single copy can serve one reader at a time; popular titles
  have long waits.
- **Fragmented experience** — discovery, borrowing, reading, and due-date reminders live
  in different places (or nowhere), so readers lose track and libraries field avoidable
  support requests.
- **Uneven connectivity and devices** — solutions that assume fast internet and modern
  hardware exclude the very people public libraries exist to serve.

The result is that learning resources the country already owns are underused. The gap is
not content — it is **reach and convenience**.

## 3. Proposed solution

Aklatan+ provides a single, reliable, secure platform that connects members to both
digital and physical collections across participating libraries nationwide.

### 3.1 What members can do

- **Discover** — search by title, author, or keyword; browse curated and featured titles.
- **Borrow & read** — borrow eBooks and read them in an in-app reader; reserve physical
  books for pickup at their home library.
- **Stay on track** — a personalized dashboard shows continue-reading progress, items due
  soon (with clear overdue indicators), and account notifications.
- **Stay local** — each member is affiliated with a **home library**, so branch-specific
  information (service hours, physical availability) reflects their community.

### 3.2 The "nationwide, still local" model

National digital content is common to all members, while a lightweight **home-library**
affiliation keeps the experience rooted in each reader's local branch. This is the core
design decision that lets one platform serve the whole country without erasing local
libraries.

### 3.3 Current status

A working cross-platform build already exists — a web application and a mobile
application sharing one design system and one cloud backend. The member landing
dashboard is implemented on both platforms. This proposal seeks endorsement to move from
build to **supervised pilot**, not funding for an idea on paper.

## 4. Goals & objectives

| # | Objective | Success indicator (to be finalized with the library) |
|---|-----------|-------------------------------------------------------|
| G1 | Widen access to library resources | Members can browse and borrow without visiting a branch |
| G2 | Reduce friction and missed due dates | Measurable drop in due-date-related support requests |
| G3 | Serve the hardest-to-reach readers | Usable on low-cost devices and low-bandwidth connections |
| G4 | Protect readers and rights-holders | Reader privacy and content licensing enforced by design |
| G5 | Stay sustainable for libraries | Affordable to operate and maintainable by library staff |

## 5. Scope

### 5.1 In scope (initial release)

- Member accounts and authentication.
- Catalog browse/search across eBooks and physical titles.
- eBook borrowing and in-app reading; physical-book reservation.
- Personalized member dashboard (greeting, featured, continue-reading, due-soon,
  notifications, home-library hours, quick links).
- Home-library affiliation and branch information.
- In-app notifications feed and push notifications.

### 5.2 Out of scope (initial release)

- Replacing or migrating any library's existing catalog/ILS system of record.
- Automated content digitization or rights clearance.
- Administrative/librarian back-office tooling beyond what a pilot requires.
- Payment or fines processing.

### 5.3 Assumptions & dependencies

- Participating libraries can provide catalog and membership data under a data-sharing
  agreement.
- Each member can be associated with one home library.
- Content made available digitally is appropriately licensed by the library.

## 6. Beneficiaries

- **Students** — resources for coursework and self-study, anytime.
- **Teachers** — a dependable source of vetted materials for their classes.
- **Parents & families** — children's and family reading beyond branch hours.
- **The wider community & lifelong learners** — equitable access regardless of location.
- **Libraries and librarians** — extended reach without losing control of collections or
  reader relationships.

## 7. Guiding principles (governance)

Every design and development decision is bound by the Aklatan+ constitution's five core
principles:

1. **Accessibility First** — WCAG 2.1 AA baseline; works on low-cost devices and poor
   connections.
2. **Inclusivity for All** — plain language, multi-language-ready, no assumed technical
   skill.
3. **Purposeful Innovation** — technology (including AI) only when it serves a real,
   demonstrated need; start simple.
4. **Security & Privacy by Design** — minimal data, encryption, least-privilege, and the
   confidentiality of what people read treated as non-negotiable.
5. **Community Service & Sustainability** — enhance not replace, respect intellectual
   property, and remain affordable and maintainable for future generations.

_(Full text: `.specify/memory/constitution.md`.)_

## 8. Benefits & expected outcomes

- Greater, more equitable use of resources the country already owns.
- Fewer missed due dates and fewer avoidable support requests.
- A modern, trusted member experience that reflects well on the library system.
- A sustainable platform libraries can afford to run and staff.

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Perceived as replacing existing libraries/initiatives | Explicitly positioned to **complement**, not replace; local libraries keep ownership and branding; physical libraries preserved; alignment with NLP sought up front |
| Duplicating existing national efforts | Seek NLP guidance early to align with, and build on, existing initiatives rather than overlap them |
| Reader privacy concerns | Privacy by design; owner-only access enforced by security rules; minimal data collection |
| Content licensing / copyright | Only licensed content is surfaced; no feature enables unauthorized redistribution |
| Low-connectivity exclusion | Accessibility & low-bandwidth resilience are release requirements, not add-ons |
| Long-term cost/sustainability | Managed cloud with usage-based cost; total cost of ownership weighed in every decision |
| Adoption | Guidance-led pilot with a few libraries before any wider rollout |

## 10. Success criteria

Measurable, technology-agnostic outcomes to be baselined during the pilot, including:
task-completion rate for first-time borrowers, time to locate and resume a book,
accessibility conformance (WCAG 2.1 AA), and reduction in due-date-related support
volume. _(See document 03 for the pilot metrics plan.)_

## 11. The ask

Respectfully, we seek the **National Library's guidance and feedback**, specifically:

1. **Recommendations** on how Aklatan+ can better align with the NLP's standards, existing
   initiatives, and future direction for public library services.
2. An opportunity to **present the concept** and provide the complete proposal and
   supporting presentation materials.
3. Guidance on a **possible guidance-led pilot** with a small set of interested libraries,
   should the NLP find the direction worthwhile — including any data-sharing arrangements
   and a point of contact.

The aim is to learn from the National Library's expertise and contribute, in a modest and
practical way, to the modernization of library services across the country.

## 12. Appendices

- **A. Technical Architecture Brief** — `02-technical-architecture.md`
- **B. Implementation Roadmap & Budget** — `03-roadmap-and-budget.md`
- **C. Constitution (governing principles)** — `.specify/memory/constitution.md`
- **D. Feature specification (member dashboard)** — `specs/001-user-landing-page/spec.md`
