# Implementation Roadmap & Budget — Aklatan+

**Companion to**: Project Proposal (`01-project-proposal.md`)
**Date**: 2026-07-06
**Status**: Draft for review

> **Important**: All figures in this document are **indicative placeholders** to
> frame planning discussions. They are **not quotations**. Real costs and timelines
> must be finalized with the National Library, participating libraries, and the
> submitting team, and depend on pilot scope, data volumes, and staffing. Every
> _[bracketed]_ value is to be supplied before submission.

---

## 1. Delivery approach

Delivery is **phased and incremental**: each phase produces something demonstrable and
independently valuable, so the National Library can review and decide at each gate before
committing further. This mirrors the MVP-first principle in the project's governance.

## 2. Phased roadmap

| Phase | Name | Duration (indicative) | Primary outcome | Exit gate |
|-------|------|----------------------|-----------------|-----------|
| 0 | Endorsement & agreements | _[2–4 weeks]_ | Data-sharing agreement, point of contact, success metrics agreed | Signed agreement |
| 1 | Pilot readiness | _[4–6 weeks]_ | Live data wiring, security review, accessibility audit, production hardening | Security & a11y sign-off |
| 2 | Supervised pilot | _[8–12 weeks]_ | _[N]_ participating libraries live with real members | Pilot metrics reviewed |
| 3 | Evaluation & iteration | _[3–4 weeks]_ | Findings, fixes, rollout recommendation | Go/no-go decision |
| 4 | Phased nationwide rollout | _[ongoing]_ | Onboard libraries in waves | Each wave stable |

### Milestones

- **M1** — Agreements signed; pilot libraries selected.
- **M2** — Pilot build passes security review and WCAG 2.1 AA audit.
- **M3** — Pilot launch (members transacting on real data).
- **M4** — Pilot evaluation report with measured outcomes.
- **M5** — Rollout plan approved.

## 3. Workstreams for the pilot

1. **Integration** — catalog + membership data sharing per participating library.
2. **Alignment & interoperability** — with NLP guidance, align with national standards and
   existing initiatives; explore optional interoperability with current systems/content so
   Aklatan+ complements rather than duplicates them.
3. **Data services** — notification-feed generation and reading-progress persistence.
4. **Compliance** — accessibility audit (automated + manual) and security review.
5. **Operations** — production environment, monitoring, backup/restore.
6. **Enablement** — brief materials and support path for pilot library staff.

> **Posture note**: Aklatan+ is offered to **complement and help modernize** existing
> services under the National Library's guidance — not to replace them. Any pilot or wider
> rollout proceeds only with NLP endorsement, and preserves the role of physical libraries.

## 4. Success metrics (baselined during pilot)

| Metric | Definition | Target (to finalize) |
|--------|-----------|----------------------|
| First-borrow success | % of new members who complete a borrow unaided | _[e.g. ≥ 90%]_ |
| Time to resume | Interactions to resume an in-progress book | ≤ 2 |
| Accessibility | WCAG 2.1 AA conformance on the member experience | No critical violations |
| Support reduction | Change in due-date-related support requests | _[e.g. −50%]_ |
| Low-bandwidth usability | Primary content usable on a slow connection | No unusable blank state |
| Reliability | Availability of core browse/borrow/read flows | _[e.g. ≥ 99.5%]_ |

## 5. Indicative cost structure

Costs are grouped by type. **Amounts are placeholders** to be replaced with real
quotations and salary/rate data. Currency: _[PHP / USD]_.

### 5.1 One-time (pilot) costs

| Item | Basis | Indicative |
|------|-------|-----------|
| Integration engineering | _[person-weeks × rate]_ | _[amount]_ |
| Data services (feed + progress) | _[person-weeks × rate]_ | _[amount]_ |
| Accessibility audit | External/internal audit | _[amount]_ |
| Security review | External/internal review | _[amount]_ |
| Production setup & hardening | Environment + config | _[amount]_ |
| Pilot enablement & docs | Materials + training | _[amount]_ |
| **Subtotal (one-time)** | | **_[total]_** |

### 5.2 Recurring (operating) costs

| Item | Basis | Indicative (monthly) |
|------|-------|----------------------|
| Cloud platform (database, functions, hosting, messaging) | Usage-based; scales with members | _[amount]_ |
| Storage & bandwidth (eBook delivery) | Volume-based | _[amount]_ |
| Maintenance & support | _[FTE fraction]_ | _[amount]_ |
| Monitoring & backups | Managed services | _[amount]_ |
| **Subtotal (recurring)** | | **_[total/month]_** |

### 5.3 Total cost of ownership (illustrative)

TCO over _[N]_ years = one-time + (recurring × months) + contingency _[e.g. 15%]_.
The usage-based cloud model means cost **scales with adoption** rather than requiring
large fixed capacity up front — a deliberate sustainability choice.

## 6. Resourcing (indicative)

| Role | Pilot allocation |
|------|------------------|
| Product / project lead | _[fraction FTE]_ |
| Full-stack engineer(s) | _[N × fraction FTE]_ |
| Accessibility / QA | _[fraction FTE]_ |
| Library liaison (from library side) | _[fraction FTE]_ |

## 7. Sustainability & handover

- **Affordable to operate** — managed cloud with usage-based billing; no server fleet.
- **Maintainable by library staff** — standard, well-documented stack; version-controlled
  configuration.
- **No lock-in of library data** — the library owns catalog and reader data; Aklatan+ is a
  custodian.
- **Handover plan** — documentation, runbooks, and training delivered before nationwide
  rollout so the platform can be sustained for future generations.

## 8. Risks to the schedule/budget

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data-sharing agreements delayed | Slips Phase 0/1 | Start legal track early; template agreement |
| Integration complexity varies by library | Cost variance | Pilot with a small, representative set first |
| Content licensing scope unclear | Feature limits | Agree licensed scope up front with the library |
| Adoption slower than expected | ROI timing | Phased rollout; enablement for staff |

## 9. Decision points for the National Library

1. Approve Phase 0 and designate a point of contact.
2. Confirm pilot libraries and data-sharing terms.
3. Agree success metrics and the end-of-pilot review date.
4. Review pilot results and decide on nationwide rollout.
5. Decide whether, and on what terms, the National Library wishes to **fund, sponsor, or
   formally adopt** Aklatan+ for the pilot or wider rollout. This is offered as an option,
   not a precondition — the developer is glad to proceed on guidance alone if the NLP
   prefers, and any funding/adoption arrangement (including IP, licensing, and support
   terms) would be defined by the National Library.

## 10. A note on funding & adoption

The developer built Aklatan+ independently and is not currently compensated for this work.
Should the National Library, at its discretion, wish to fund development of the pilot,
sponsor the project, or formally adopt Aklatan+ as (or as part of) a National Library
initiative, the developer welcomes that conversation and will work with the NLP to define
appropriate terms — covering scope, cost, intellectual property, and long-term support. This
is raised here for completeness and transparency; it is not a condition of providing
guidance, presenting the concept, or supporting a guidance-led pilot.
