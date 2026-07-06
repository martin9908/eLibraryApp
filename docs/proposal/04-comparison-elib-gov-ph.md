# Comparison: Aklatan+ and the Philippine eLib (elib.gov.ph)

**Companion to**: Project Proposal (`01-project-proposal.md`)
**Date**: 2026-07-06
**Status**: Draft for review

> This comparison is based on **publicly available information** about the Philippine eLib
> as of July 2026 (see Sources). It is written to show how Aklatan+ **complements** the
> existing national eLibrary — consistent with our governing principle to *enhance, not
> replace* the country's library system — not to disparage it. Where a fact could not be
> confirmed publicly, it is marked _(unverified)_ and should be checked with the NLP before
> submission.

---

## 1. What the Philippine eLib is

The **Philippine eLib** (elib.gov.ph) is a collaborative national digital library project
whose purpose is to "provide for the information needs of all sectors of society in a
convenient, affordable, and efficient way."

- **Operated by** five partner institutions: the **National Library of the Philippines
  (NLP)**, the **University of the Philippines (UP)**, the **Department of Science and
  Technology (DOST)**, the **Department of Agriculture (DA)**, and the **Commission on
  Higher Education (CHED)**; hosted at the U.P. Diliman University Library.
- **Funded** through the Philippine Government's e-Government Fund.
- **Offers** a union catalog combining the holdings of the five partners; digitized
  Filipiniana; theses and dissertations; special research collections; and subscription
  electronic databases.
- **Features** include basic and advanced search, subject browsing, a "book cart" for
  saving selections, a downloadable user manual, adjustable text size, and registration
  (free and membership-based access).

In short, the Philippine eLib is primarily a **scholarly discovery portal and union
catalog** for research, academic, and heritage materials, aggregating what partner
institutions hold.

**Confirmed by the submitting team**: the Philippine eLib has **no in-app eReader** — users
cannot read borrowed titles inside the platform. Its lending model is to **reserve/request
materials for physical pickup** at a library. Reading online is limited to discovery of
digitized/subscription content rather than a consumer borrow-and-read experience.

## 2. What Aklatan+ is

Aklatan+ is a **member-facing, cross-platform borrowing-and-reading experience** (web +
iOS/Android) for the wider public across participating local libraries. Each member has a
**home library**, a personalized dashboard (continue-reading, due-soon, notifications), and
can **borrow, return, and read** eBooks in-app and reserve physical books — with
reader-privacy and role-based access enforced at the data layer.

Aklatan+ is proposed as the **successor platform** to elib.gov.ph: it carries forward the
eLib's core value — *finding and accessing the country's collections* — and adds what the
legacy portal cannot do — *borrowing, reading in-app, and the everyday account experience
for the general public on their phones*. The existing collections, digitized Filipiniana,
and institutional partnerships are **migrated and preserved**; the dated software is
**retired**.

## 3. Side-by-side comparison

| Dimension | Philippine eLib (elib.gov.ph) | Aklatan+ |
|-----------|-------------------------------|----------|
| **Primary purpose** | National union catalog + scholarly/heritage discovery | Everyday borrow / return / read experience for the public |
| **Operator model** | Consortium of NLP, UP, DOST, DA, CHED | Platform enhancing participating local libraries nationwide |
| **Core content** | Digitized Filipiniana, theses, dissertations, research collections, subscription databases | Local library eBook and physical collections (per home library) |
| **Primary audience** | Researchers, students, academics | Students, teachers, parents, general community |
| **Discovery** | Basic/advanced search, subject browsing, book cart | Search + personalized dashboard (featured, continue-reading) |
| **Lending model** | **Reserve / request materials for physical pickup** at a library | In-app eBook borrowing **and** physical-book reservation, with due-date tracking |
| **In-app eReader** | **None** — cannot read borrowed titles in the platform | Yes — read borrowed eBooks in-app, resume where you left off |
| **Personalization** | Registration; saved selections (book cart) | Home-library affiliation, reading progress, due-soon alerts, in-app notifications |
| **Platforms** | Web portal | Web + native mobile (iOS/Android), shared design system |
| **Mobile app** | _(unverified — no official native app confirmed publicly)_ | Yes — Expo/React Native app |
| **Roles / administration** | Institutional/partner administration | Explicit RBAC: Patron / Librarian (scoped) / Admin (nationwide) — see feature 002 |
| **Accessibility** | Adjustable text size | WCAG 2.1 AA baseline; keyboard + screen-reader; low-bandwidth resilience |
| **Reader privacy** | _(unverified)_ | Owner-only personal data enforced by security rules (privacy by design) |
| **Local-library context** | National/partner-agency oriented | Per-branch: home-library hours, availability |

> Rows marked _(unverified)_ reflect the limits of publicly available information, not
> confirmed absences. Confirm with the NLP.

## 4. Where they overlap

- Both are **national in ambition** and serve students/researchers.
- Both provide **search and registration**.
- Both aim to widen **affordable, convenient access** to library resources.

## 5. How Aklatan+ modernizes and succeeds the eLib

Aklatan+ is positioned as the **modern successor** to the aging elib.gov.ph portal —
replacing outdated software while preserving and elevating the national library's mission,
collections, and partnerships:

1. **Everything the eLib does, plus what it can't** — the eLib lets users *discover and
   reserve materials for physical pickup*; Aklatan+ carries that discovery role forward and
   adds the capability the legacy portal lacks: **borrowing and reading eBooks directly
   in-app**, plus the everyday account experience.
2. **Reach the phone-first majority** — Aklatan+ brings a modern native mobile experience
   and personalized account features (due dates, progress, notifications) that a research
   portal is not designed to provide.
3. **Local libraries, front and center** — the eLib is organized around partner agencies;
   Aklatan+ is organized around each member's **home library**, extending the reach of
   local branches without displacing them.
4. **Migrate, don't duplicate** — the eLib's existing holdings, digitized Filipiniana, and
   catalog data are **migrated into** Aklatan+ (or federated during transition) rather than
   re-created, so no investment or content is lost when the legacy portal is retired.
   _(Migration/transition mechanism to be planned with the NLP/consortium.)_
5. **Modern access safeguards** — Aklatan+ adds explicit role-based access (Patron /
   Librarian / Admin) and privacy-by-design enforcement that support safe, delegated
   operation by local library staff.

**Framing for the submission**: this initiative is a **full modernization of the national
eLibrary — Aklatan+ is the successor platform to elib.gov.ph.** The aging, limited portal
is retired; its collections, digitized content, and partnerships are migrated and carried
forward into a modern, mobile-first, read-in-app experience. What is replaced is *outdated
software* — not the library, its mission, its content, or its institutional partners.

## 6. Honest limitations of this comparison

- Feature details of the eLib evolve; some rows are marked _(unverified)_ and must be
  validated with the NLP before the proposal is submitted.
- Aklatan+ is at pilot-readiness stage (a working cross-platform build with a pilot to
  follow), whereas the eLib is an established, operating national service. The comparison
  is about **fit and complementarity**, not maturity.
- This document should be reviewed by someone familiar with the current eLib to avoid
  overstating differences.

## Sources

- [Philippine eLib — elib.gov.ph](https://www.elib.gov.ph/)
- [Philippine eLibrary — National Library of the Philippines](https://web.nlp.gov.ph/philippine-elibrary/)
- [eLib: A portal of all things Pinoy — Philstar](https://www.philstar.com/business/technology/2005/05/30/279708/elib-portal-all-things-pinoy)
- [The Philippine eLib Project — UP Library Bulletin](https://uplibrarybulletin.wordpress.com/2006/06/07/philippine-elib-project/)
