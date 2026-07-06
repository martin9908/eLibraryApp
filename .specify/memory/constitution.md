<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR amendment. Adds a Purpose & Posture preamble and materially
                expands Principle V to reflect the collaborative, guidance-seeking
                approach communicated to the National Library of the Philippines
                (NLP): Aklatan+ is a Hybrid Community Library System that COMPLEMENTS
                and helps MODERNIZE public libraries, PRESERVES the role of physical
                libraries, and SEEKS ALIGNMENT with national standards and NLP's
                direction — it does not seek to replace existing services.

Renamed: title "eLibrary+ Constitution" → "Aklatan+ Constitution" (product name;
         the platform was previously referred to as eLibrary+).

Principles (5, unchanged in number):
  I.   Accessibility First
  II.  Inclusivity for All
  III. Purposeful Innovation
  IV.  Security & Privacy by Design
  V.   Community Service & Sustainability  (expanded: hybrid, preserve physical
       libraries, align with national standards)

Added sections:
  - Purpose & Posture (preamble)  [NEW in 1.1.0]
  - Platform Integrity & Intellectual Property (Additional Constraints)
  - Development Workflow & Quality Gates
  - Governance

Removed sections: None

Templates requiring updates:
  ✅ .specify/templates/plan-template.md      — Constitution Check gate is generic; aligned.
  ✅ .specify/templates/spec-template.md       — No constitution-specific tokens; aligned.
  ✅ .specify/templates/tasks-template.md      — No constitution-specific tokens; aligned.
  ✅ .specify/templates/checklist-template.md  — No constitution-specific tokens; aligned.

Follow-up TODOs: None.
-->

# Aklatan+ Constitution

## Purpose & Posture

**Aklatan+** is a **Hybrid Community Library System** that helps public libraries modernize
by seamlessly integrating traditional library operations with digital library technologies.
Its posture toward the existing library system is **collaborative, not disruptive**:

- It **complements and helps modernize** existing library services; it does not seek to
  replace the National Library, its partner institutions, or existing initiatives.
- It **preserves and strengthens the role of physical libraries** within their communities,
  unifying physical and digital collections rather than displacing either.
- It **seeks the guidance of, and alignment with, the National Library of the Philippines**
  — its standards, existing initiatives, and long-term direction for public library
  modernization.
- It aims to be a **practical, sustainable contribution** adaptable by public libraries,
  educational institutions, and local government units.

This posture governs how every principle below is interpreted: where a decision could read
as replacing or diminishing existing library services, the collaborative, complementary
reading always prevails.

## Core Principles

### I. Accessibility First

Every feature MUST be usable by the widest possible range of people, devices, and
connection conditions. Interfaces MUST meet WCAG 2.1 AA as a baseline: sufficient color
contrast, full keyboard navigation, screen-reader support, and text alternatives for
non-text content. The platform MUST remain usable on low-cost devices and low-bandwidth
connections; core reading and discovery flows MUST degrade gracefully when connectivity
is poor. No feature ships if it makes an existing accessibility guarantee worse.

**Rationale**: A national learning resource that only serves the well-equipped is not
national. Accessibility is a precondition for equity, not an enhancement to add later.

### II. Inclusivity for All

The platform MUST serve students, teachers, parents, and the wider community without
privileging any single group. Content, language, and navigation MUST be understandable
to non-expert users. Features MUST NOT assume prior technical skill, a specific
socioeconomic background, or a single language where multi-language support is
reasonably achievable. Design decisions that narrow the audience MUST be justified in
writing and reviewed.

**Rationale**: Lifelong learning requires that the least-served users can succeed, so
inclusivity is measured by the experience of the hardest-to-reach user, not the average.

### III. Purposeful Innovation

Innovation MUST solve a demonstrated user or library need — not add novelty for its own
sake. New technology (including AI features) is adopted only when it measurably improves
access, discovery, or learning outcomes AND does not compromise Principles I, IV, or V.
Every non-trivial addition MUST start simple (YAGNI), and added complexity MUST be
justified against a simpler rejected alternative.

**Rationale**: A platform pitched to a national institution must stay reliable and
affordable; unchecked complexity is the primary threat to both.

### IV. Security & Privacy by Design

User data MUST be protected by default. The platform MUST collect the minimum personal
data required, encrypt sensitive data in transit and at rest, and enforce
least-privilege access to reader records. Authentication, authorization, and data-access
paths MUST be reviewed before release. Privacy of borrowing and reading history is
treated as confidential. Security-relevant events MUST be logged for audit. Any change
touching authentication, personal data, or access control REQUIRES explicit security
review.

**Rationale**: Trust in a public library is built on the confidentiality of what people
read; a single breach of reader privacy is an institutional, not just technical, failure.

### V. Community Service & Sustainability

The platform exists to enhance — never replace — the existing nationwide library system,
and every decision MUST serve that mission. As a **Hybrid Community Library System**, it
MUST **preserve and strengthen the role of physical libraries** while extending digital
access — unifying physical and digital collections, never displacing either. It MUST
**complement existing library systems and initiatives** and be designed to **align with the
National Library of the Philippines' standards and direction**, actively **seeking the
library community's guidance** rather than presuming to supersede it. Solutions MUST be
affordable to operate and maintainable by the library's own staff over the long term; total
cost of ownership and operational burden MUST be weighed in every significant technical
decision. Intellectual property and licensing terms of hosted content MUST be respected.
The platform MUST remain beneficial and sustainable for future generations of users and
maintainers, and MUST be adaptable by public libraries, educational institutions, and local
government units.

**Rationale**: A system that libraries cannot afford, staff, or sustain — or one that
sidelines physical libraries or ignores national standards — does not serve the community
regardless of its features. Durable adoption comes from partnership and alignment, not
disruption.

## Platform Integrity & Intellectual Property

- The platform MUST integrate with and complement existing library workflows and systems;
  it MUST NOT duplicate or undermine services the national library already provides.
- Content licensing and copyright MUST be enforced technically and operationally; no
  feature may enable unauthorized redistribution of protected works.
- Reliability is a first-class requirement: core discovery, reading, and lending flows
  MUST have defined availability expectations and graceful failure behavior.
- Data ownership remains with the library and its users; the platform is a custodian, not
  an owner, of reader and catalog data.

## Development Workflow & Quality Gates

- Every change MUST be reviewed against the five Core Principles before merge; the review
  MUST explicitly confirm no accessibility, inclusivity, security, or privacy guarantee
  is regressed.
- Features SHOULD be delivered as independently testable, demonstrable slices that each
  provide user value (MVP-first).
- Changes touching authentication, personal data, access control, or content licensing
  REQUIRE the corresponding security/IP review sign-off.
- Complexity MUST be justified: any deviation from the simplest viable approach is
  recorded with its rationale and the rejected alternative.

## Governance

This constitution supersedes other development practices where they conflict. All plans,
specifications, and pull requests MUST verify compliance with the Core Principles; the
Constitution Check gate in the planning template enforces this before design proceeds.

Amendments MUST be proposed in writing with rationale and impact, reviewed and approved
by the project maintainers, and accompanied by a migration or propagation note for any
affected templates or artifacts. Versioning follows semantic versioning:

- **MAJOR**: Backward-incompatible governance changes or removal/redefinition of a
  principle.
- **MINOR**: A new principle or section is added, or guidance is materially expanded.
- **PATCH**: Clarifications, wording, or non-semantic refinements.

Compliance is reviewed at each feature review and at release. Violations MUST be resolved
or explicitly justified in the plan's Complexity Tracking section before proceeding.

**Version**: 1.1.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
