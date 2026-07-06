# Feature Specification: Role-Based Access Control (Patron / Librarian / Admin)

**Feature Branch**: `002-rbac-access-control`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Add RBAC (Librarian, Patron, Admin). Patron can only see materials, borrow, return, and read. Librarians have the same access as Patron plus manage inventory and patrons in their assigned library/region. Admin has the same access as Librarian plus manage librarians, patrons, and inventory nationwide."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Patron uses the library within their role (Priority: P1)

A patron signs in and can discover materials, borrow and return items, and read eBooks —
exactly the current member experience. They MUST NOT see or be able to perform any
management action (no inventory editing, no managing other people).

**Why this priority**: Patron is the default, largest role and the baseline everyone
starts from. Establishing the role model and locking the patron boundary is the smallest
slice that delivers value and makes the system safe.

**Independent Test**: Sign in as a patron; confirm browse/borrow/return/read all work and
that no management surfaces (inventory or people management) are visible or reachable, and
that direct attempts to perform management actions are denied.

**Acceptance Scenarios**:

1. **Given** a signed-in patron, **When** they use the app, **Then** they can browse,
   borrow, return, and read materials as today.
2. **Given** a signed-in patron, **When** they view navigation, **Then** no inventory or
   people-management entry points appear.
3. **Given** a signed-in patron, **When** they attempt a management action directly (e.g.
   editing a book or another user), **Then** the action is denied by the system, not just
   hidden in the UI.
4. **Given** a brand-new self-registered account, **When** it is created, **Then** it is
   assigned the Patron role by default.

---

### User Story 2 - Librarian manages their assigned library/region (Priority: P2)

A librarian has everything a patron has, plus the ability to manage **inventory**
(add/edit/remove titles and copies) and **patrons** (view, assist, and manage patron
accounts) **only within their assigned library or region**. They cannot act outside their
assignment and cannot manage other librarians or admins.

**Why this priority**: Librarians are the operational backbone; scoped management is the
core new capability. It depends on the role model (US1) but delivers distinct value.

**Independent Test**: Sign in as a librarian assigned to Library A; confirm they can manage
inventory and patrons for Library A, cannot manage inventory/patrons for Library B, and
cannot manage any librarian or admin account.

**Acceptance Scenarios**:

1. **Given** a librarian assigned to Library A, **When** they manage inventory, **Then**
   they can add/edit/remove titles and adjust copy counts for Library A.
2. **Given** a librarian assigned to Library A, **When** they view patrons, **Then** they
   see and can manage only patrons of Library A (or their assigned region).
3. **Given** a librarian assigned to Library A, **When** they attempt to manage inventory
   or patrons of Library B, **Then** the action is denied.
4. **Given** a librarian, **When** they attempt to change any account's role or manage a
   librarian/admin, **Then** the action is denied.
5. **Given** a librarian, **When** they use patron features, **Then** they retain full
   patron capabilities (browse/borrow/return/read).

---

### User Story 3 - Admin manages nationwide (Priority: P3)

An admin has everything a librarian has, plus the ability to manage **librarians, patrons,
and inventory nationwide**, including assigning the librarian role and a librarian's
library/region assignment.

**Why this priority**: Admin capability is essential for running the system but is used by
the fewest people and builds on the librarian capabilities.

**Independent Test**: Sign in as an admin; confirm they can create/assign librarians (and
their scope), manage patrons and inventory for any library nationwide, and that these
actions are recorded.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they assign the librarian role to a user, **Then** that
   user gains librarian capabilities scoped to the library/region the admin assigns.
2. **Given** an admin, **When** they manage inventory or patrons for any library, **Then**
   the action succeeds regardless of location.
3. **Given** an admin, **When** they change or revoke a user's role, **Then** the change
   takes effect for that user's subsequent actions.
4. **Given** any role-changing or nationwide management action, **When** it is performed,
   **Then** it is recorded in an audit trail (who, what, when).

---

### Edge Cases

- **Privilege escalation attempt**: A patron or librarian attempts to grant themselves a
  higher role directly — MUST be impossible; role changes are server-authorized only.
- **Unassigned librarian**: A librarian with no library/region assignment can perform no
  scoped management until assigned.
- **Role change mid-session**: When a user's role or scope changes, their access reflects
  the change without requiring a full re-registration (a re-authentication/refresh is
  acceptable).
- **Last admin protection**: The system MUST prevent removing/demoting the final remaining
  admin, to avoid lockout.
- **Deactivated account**: A suspended/deactivated user cannot sign in or act regardless of
  role.
- **Cross-region librarian**: A librarian assigned to a region manages all libraries within
  that region; a librarian assigned to specific libraries manages only those.
- **Deleting a book with active loans / a patron with active loans**: Management actions
  MUST handle in-use records safely (block or require resolution) rather than orphaning data.

## Requirements *(mandatory)*

### Functional Requirements

**Roles & assignment**

- **FR-001**: The system MUST define exactly three roles: **Patron**, **Librarian**, and
  **Admin**, with a strict capability hierarchy (Admin ⊇ Librarian ⊇ Patron).
- **FR-002**: New self-registered accounts MUST default to the Patron role.
- **FR-003**: A user's role MUST be changeable only by an authorized actor via a
  server-authorized action; a user MUST NOT be able to change their own or anyone's role
  from the client.
- **FR-004**: A librarian MUST have a defined scope: one or more assigned libraries and/or
  an assigned region.
- **FR-005**: Only an admin MAY assign or revoke the Librarian and Admin roles and set a
  librarian's library/region scope.
- **FR-006**: A librarian MAY manage patron accounts within their assigned scope but MUST
  NOT manage librarian or admin accounts, nor change any account's role.

**Access control (enforcement)**

- **FR-007**: Every capability boundary MUST be enforced on the server/data layer, not only
  hidden in the UI; a direct request that exceeds the actor's role/scope MUST be denied.
- **FR-008**: Patrons MUST be able to browse, borrow, return, and read materials, and MUST
  be denied all inventory- and people-management actions.
- **FR-009**: Librarians MUST be able to create, edit, and remove inventory (titles and
  copy counts) and manage patrons, restricted to their assigned library/region.
- **FR-010**: Admins MUST be able to perform all librarian actions for any library
  nationwide, and manage librarians (including role and scope assignment).
- **FR-011**: The UI MUST present only the navigation and actions permitted for the signed-in
  user's role and scope (no dead or forbidden entry points).

**Safety & auditability**

- **FR-012**: The system MUST prevent demoting or removing the last remaining admin.
- **FR-013**: Role assignments and nationwide/administrative management actions MUST be
  recorded in an audit trail capturing actor, action, target, and timestamp.
- **FR-014**: A deactivated/suspended account MUST be prevented from signing in or acting.
- **FR-015**: Management actions on records that are in use (e.g. a title with active loans)
  MUST be handled safely — blocked or requiring resolution — rather than orphaning data.

**Consistency across platforms**

- **FR-016**: Role-based access MUST behave consistently on both the web and mobile apps.

### Key Entities *(include if data involved)*

- **User (member)**: Adds a **role** (Patron | Librarian | Admin), an **account status**
  (active | suspended), and — for librarians — a **scope** (assigned library IDs and/or
  region). Existing profile fields (home library, member type) remain.
- **Library / Branch**: Existing entity; gains relevance as the unit of librarian scope
  (each library belongs to a region).
- **Inventory item (Book)**: Existing catalog entity; management (create/edit/remove,
  copy counts) becomes a role- and scope-gated capability. Association to a library
  determines who may manage it.
- **Role assignment / Audit entry**: A record of a role or scope change, or an
  administrative management action — actor, action, target, timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of management actions attempted outside an actor's role/scope are denied
  at the data layer (verified by direct-request tests, not UI-only).
- **SC-002**: A patron account can complete browse/borrow/return/read with zero management
  entry points visible.
- **SC-003**: A librarian can manage inventory and patrons for their assigned scope and is
  denied for any other scope, in 100% of tested cross-scope attempts.
- **SC-004**: An admin can assign a librarian (with scope) and that librarian's new
  capabilities take effect within one session/refresh.
- **SC-005**: No sequence of client actions can elevate a user's own role (privilege
  escalation attempts all fail).
- **SC-006**: The system never reaches a state with zero admins.
- **SC-007**: Every role change and nationwide management action appears in the audit trail
  with actor, target, and timestamp.
- **SC-008**: Role-based behavior is identical on web and mobile for the same account.

## Assumptions

- Authentication (Firebase email/password) and the `users/{uid}` profile already exist and
  are reused; RBAC adds role/scope/status on top.
- The first admin is provisioned out-of-band (secure seed/script); admins then create other
  admins and librarians.
- Patron is the default role; elevation is always performed by a higher-privileged actor.
- "Assigned library and/or region" means a librarian may be scoped to specific libraries or
  to a whole region (all libraries within it).
- Management back-office surfaces (inventory and people management) are part of this feature
  but their exhaustive UI detail may be delivered incrementally; the role/scope enforcement
  is the non-negotiable core.
- Content licensing and reader-privacy obligations from the constitution continue to apply;
  RBAC narrows, never widens, who can see personal data.

## Out of Scope

- Fine-grained per-permission (attribute-level) access beyond the three roles + librarian
  scope.
- Self-service role requests/approval workflows.
- Federated identity / SSO (may be considered later).
- Bulk import/migration tooling for inventory or accounts.
- Fines/payments and circulation policy engines.
