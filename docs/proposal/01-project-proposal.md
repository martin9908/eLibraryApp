# Project Proposal — Aklatan+

**A nationwide digital library platform**

**Prepared for**: National Library submission
**Date**: 2026-07-06
**Version**: 0.1 (draft for review)
**Prepared by**: _[team / organization]_
**Contact**: _[name / email / office]_

> Placeholders in _[brackets]_ mark information to be supplied by the submitting
> team (names, dates, figures, official titles) before submission.

---

## 1. Introduction

Aklatan+ is a cross-platform digital library service (web and mobile) whose purpose is
to **enhance the nationwide library system while replacing its aging digital portal**. It
makes the country's learning resources easier to discover, borrow, and read for students,
teachers, parents, and the wider community, while local libraries retain ownership of
their collections, their catalog data, and their relationship with readers.

This initiative is a **full modernization of the national eLibrary — Aklatan+ is the
successor platform to elib.gov.ph.** The Philippines already invested in a national digital
library, but the current portal is dated and limited (discovery and reserve-for-pickup
only). Aklatan+ **migrates and carries forward** that investment — the collections,
digitized Filipiniana, and institutional partnerships — into a modern, mobile-first
platform that adds the capability the current system does not offer: **borrowing and
reading eBooks directly in-app**, alongside a personalized, accessible member experience.
The legacy software is retired; the mission, holdings, and partnerships are preserved and
elevated.

> **A note on "enhance, not replace":** the project's guiding principle is to enhance the
> library *system* — the institution, its mission, and its collections — never to diminish
> it. Replacing the **outdated software portal** is fully consistent with that principle:
> what is retired is aging technology, not the library, its content, or its partnerships.

This proposal describes the problem, the proposed solution, its scope, the value it
delivers, how it is governed, and what we ask of the National Library to proceed.

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
| Perceived as replacing local libraries | Local libraries keep ownership and branding of their branch context; what is replaced is the aging national *portal*, not local branches |
| Consortium concern over retiring elib.gov.ph | Frame as modernization: migrate collections/partnerships, preserve the consortium's mission and credit; secure NLP/consortium buy-in before retirement |
| Reader privacy concerns | Privacy by design; owner-only access enforced by security rules; minimal data collection |
| Content licensing / copyright | Only licensed content is surfaced; no feature enables unauthorized redistribution |
| Low-connectivity exclusion | Accessibility & low-bandwidth resilience are release requirements, not add-ons |
| Long-term cost/sustainability | Managed cloud with usage-based cost; total cost of ownership weighed in every decision |
| Adoption | Supervised pilot with a few libraries before nationwide rollout |

## 10. Success criteria

Measurable, technology-agnostic outcomes to be baselined during the pilot, including:
task-completion rate for first-time borrowers, time to locate and resume a book,
accessibility conformance (WCAG 2.1 AA), and reduction in due-date-related support
volume. _(See document 03 for the pilot metrics plan.)_

## 11. The ask

We request the National Library's endorsement to:

1. Proceed to a **supervised pilot** with _[N]_ participating libraries.
2. Establish a **data-sharing agreement** for catalog and membership data.
3. Designate a **point of contact** within the library system for the pilot.
4. Agree on **success metrics** and a review checkpoint at the end of the pilot.

## 12. Appendices

- **A. Technical Architecture Brief** — `02-technical-architecture.md`
- **B. Implementation Roadmap & Budget** — `03-roadmap-and-budget.md`
- **C. Constitution (governing principles)** — `.specify/memory/constitution.md`
- **D. Feature specification (member dashboard)** — `specs/001-user-landing-page/spec.md`
