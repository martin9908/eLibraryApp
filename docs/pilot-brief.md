# Pilot Brief — Aklatan+

### Validating a Hybrid Community Library System, one library cluster at a time

*Prepared for the National Library of the Philippines and partner institutions · 2026-07-20*

---

## 1. Overview & objective

**Aklatan+** is a Hybrid Community Library System that unifies a library's physical and digital collections in a single platform for both staff and readers. The purpose of this pilot is to **validate the model in one real library cluster** — proposed as the **National Capital Region (NCR) cluster** of NLP public libraries — under everyday conditions, and to do so in a way that **replicates cleanly to any other cluster**.

The pilot is deliberately scoped as a *cluster*, not a single branch: a cluster shares a catalog, staff, and reader base, which is the natural unit at which the hybrid model proves its value and at which results generalize. Aklatan+ is presented as a **complement to existing library operations** and to NLP standards — the pilot is a collaboration, and NLP's guidance shapes it throughout.

> **Assumption to confirm with NLP:** the number of branches in the NCR cluster. The pilot design is branch-count-agnostic; site count only affects onboarding effort and the reader-adoption targets in §6, not the architecture.

## 2. What the pilot entails

Two applications are deployed against the cluster's real (or representative) catalog:

- **Librarian & admin console (web).** Catalog and inventory management, patron management, loan handling, and reporting — scoped so each librarian only manages their assigned library or region.
- **Patron app (mobile).** Discover titles, borrow and return, read licensed eBooks, resume reading where they left off, and receive notifications (due-date reminders, "book now available" alerts).

Core flows exercised during the pilot:

| Flow | What it demonstrates |
|---|---|
| Discover & borrow | Unified catalog of physical + digital titles; safe concurrent borrowing |
| Return | Correct inventory accounting; staff-assisted corrections |
| Secure eBook reading | Licensed eBooks lent via individual, time-limited access — no uncontrolled copying |
| Notifications | Automated due-date reminders and availability alerts |
| Reading progress | Readers resume eBooks across sessions |
| Role-based administration | Librarians and admins act only within their scope; all privileged actions logged |

## 3. Participants & roles

| Participant | Role in the pilot |
|---|---|
| **National Library of the Philippines** | Guiding standard-setter; defines alignment expectations, reviews outcomes |
| **Cluster branch librarians** | Day-to-day operators; hold the *librarian* role, scoped to their branch/region |
| **Cluster administrator** | Oversees the cluster; holds the *admin* role |
| **Patrons** | Students, teachers, parents, and community members (the platform's four member types) |
| **Development team** | Deployment, data loading, training, support, and maintenance during the pilot |
| **Sponsoring / endorsing office** | Provides endorsement and helps remove institutional barriers |

Reader accounts default to the least-privileged *patron* role. Staff roles are granted deliberately and can be scoped to specific libraries or a region.

## 4. Scope

**In scope**
- Catalog discovery, borrowing, returning of physical and digital titles
- Secure, loan-gated eBook reading with resume-where-you-left-off
- In-app and push notifications (due reminders, availability)
- Role-based administration with audit logging
- Export of catalog and member data to the Koha ILS format (interoperability demonstration)

**Out of scope for this pilot (flagged as later phases)**
- Full offline reading of downloaded eBooks (current release is online-first; see Technical Dossier §8)
- Multi-language / Filipino-language interface (Roadmap)
- Live integration with third-party ILS or the eLib consortium (feasible later; gated on data-sharing agreements)

Stating these boundaries up front keeps the pilot honest and its success criteria clean.

## 5. Timeline

Durations are relative to an agreed **pilot start date (T0)**; calendar dates are set once T0 is confirmed with NLP.

| Phase | Window | Activities |
|---|---|---|
| **0 — Preparation** | Weeks 1–2 | Confirm cluster & branches; provision environment; load catalog; export/verify data to Koha format |
| **1 — Staff onboarding** | Weeks 3–4 | Train librarians/admins on the console; set roles and scopes; dry-run loan lifecycle |
| **2 — Soft launch** | Weeks 5–6 | Limited reader group per branch; monitor borrow/return, eBook access, notifications |
| **3 — Full cluster launch** | Weeks 7–10 | Open to all cluster patrons; steady-state operation; collect metrics |
| **4 — Review & report** | Weeks 11–12 | Evaluate against success metrics; document findings; recommend go/no-go and hardening priorities for wider rollout |

Total: **~12 weeks** per cluster. Subsequent clusters reuse the same playbook with shorter preparation.

## 6. Expected outcomes & success metrics

| Dimension | Target signal |
|---|---|
| **Adoption** | % of cluster's active members registered; number of loans (physical + digital) per week |
| **Digital access** | Number of eBook loans and reading sessions; readers using resume-reading |
| **Reliability** | Core discover/borrow/return/read flows available during library hours; no data-integrity errors (e.g. over-borrowing) |
| **Staff efficiency** | Reduction in manual effort for cataloging, lending, and reminders (staff-reported) |
| **Reader satisfaction** | Post-pilot survey of patrons and librarians |
| **Privacy & security** | **Zero** reader-privacy or access-control incidents |
| **Cost** | Operating cost per branch, to inform sustainability at scale |
| **Interoperability** | Successful export of catalog and member data to Koha format |

## 7. Governance, privacy & data ownership

- **Data ownership stays with the library and its users.** Aklatan+ is a custodian, not an owner, of catalog and reader records; all data is exportable at any time.
- **Reading and borrowing history is confidential**, accessible only to the reader and appropriately scoped staff.
- **Every privileged action is logged** (role changes, deletions, status changes) in an audit trail for accountability.
- **Content licensing is respected and technically enforced** — eBooks are lent, never openly redistributed.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Uneven connectivity in some branches | Online-first flows are lightweight; full offline reading is a prioritized post-pilot roadmap item |
| No automated release pipeline / crash monitoring yet | Pilot runs under a manual release checklist and close support; CI/CD, automated tests, and error monitoring are the first hardening milestone |
| Accessibility not yet independently audited | Solid accessibility baseline in place; WCAG 2.1 AA audit and multi-language support scheduled as hardening/roadmap work |
| Legacy eBook titles not yet migrated to secure storage | Prioritize migrating cluster titles into the access-controlled store before full launch |
| Reader-privacy expectations | Confidentiality and audit logging built in; zero-incident target with explicit review |

## 9. What we ask of NLP and partners

Confirmation of the cluster and its branches, access to a representative catalog, introductions to participating branch librarians, and NLP's guidance on standards and alignment. In return, the pilot delivers a documented, measurable demonstration of the hybrid model and a clear recommendation for any wider adoption.

---

*Companion documents: **Legislative Brief** (1 page) and **Technical Dossier** (architecture, security, accessibility, offline, operational readiness).*
