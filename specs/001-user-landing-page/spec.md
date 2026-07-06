# Feature Specification: Member Landing Dashboard (Nationwide)

**Feature Branch**: `001-user-landing-page`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "I want to build a landing page for users that looks like this: [dashboard mockup] but let's target a nationwide release now not just with binangonan"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land on a personalized home after signing in (Priority: P1)

A registered member (student, teacher, parent, or general community member) signs in and
immediately lands on a personalized home dashboard that greets them by name, shows their
active loans and reading progress, and gives one-tap access to browse both digital and
physical collections. The dashboard reflects the member's affiliated local library rather
than any single fixed municipality.

**Why this priority**: This is the primary surface members see on every visit. Without it,
there is no home for returning users and none of the other panels have a place to live. It
is the smallest slice that delivers standalone value: a member can sign in, see their
account, and reach the collection.

**Independent Test**: Sign in as a member with at least one active loan and one in-progress
book; confirm the dashboard shows a personalized greeting, the two primary browse actions,
and the member's current items — and that the branding/context reflect the national service
and the member's home library, not a single municipality.

**Acceptance Scenarios**:

1. **Given** a registered member with a valid session, **When** they open the home
   dashboard, **Then** they see a greeting with their name and member type, primary actions
   to browse eBooks and physical books, and their current reading and loan status.
2. **Given** a member affiliated with a specific local library, **When** the dashboard
   loads, **Then** library-specific details (such as service hours and physical-collection
   availability) reflect that member's home library.
3. **Given** a member with no active loans or reading history, **When** the dashboard loads,
   **Then** empty states invite them to start browsing rather than showing blank panels.

---

### User Story 2 - See and act on due dates and account alerts (Priority: P2)

A member needs to know at a glance what is due soon, what is overdue, and what recent
account events have occurred (new arrivals, returns confirmed, due-date reminders), and be
able to act on them without leaving the dashboard.

**Why this priority**: Timely due-date awareness is the core value a library adds to a
borrower and directly reduces overdue items and support requests. It depends on the P1 home
existing but delivers distinct, measurable value on its own.

**Independent Test**: Sign in as a member with items due within the reminder window and at
least one overdue item; confirm the dashboard surfaces a prioritized "Due Soon" list with
clear urgency indicators and a notifications feed, and that acting on an item (e.g., opening
it or marking a notification read) updates the display.

**Acceptance Scenarios**:

1. **Given** a member with an item due within the reminder window, **When** the dashboard
   loads, **Then** that item appears in a "Due Soon" list with a human-readable due date and
   an urgency indicator (e.g., due tomorrow, days remaining, overdue).
2. **Given** a member with an overdue item, **When** they view the "Due Soon" list, **Then**
   the overdue item is visually distinguished from items that are merely approaching.
3. **Given** unread notifications, **When** the member selects "mark all as read", **Then**
   the unread count clears and the change persists on reload.

---

### User Story 3 - Discover featured and continue-reading content (Priority: P3)

A member wants to be drawn into reading: the dashboard highlights featured titles they can
borrow immediately and lets them resume books they have already started at the exact page
they left off.

**Why this priority**: Discovery and frictionless resumption drive engagement and lifelong
learning, but the dashboard is still useful without them. This layer increases usage once
the essential account and alerting surfaces exist.

**Independent Test**: Sign in as a member with in-progress books and confirm a "Featured"
section shows borrowable titles with availability status and a "Continue Reading" section
shows resume points; selecting a continue-reading item returns the member to their last
position.

**Acceptance Scenarios**:

1. **Given** featured titles are curated for the member's context, **When** the dashboard
   loads, **Then** each featured title shows its title, author, availability status, and a
   borrow action.
2. **Given** a member has partially read a book, **When** they open "Continue Reading",
   **Then** the item shows current progress (e.g., page X of Y) and resumes at that point
   when selected.
3. **Given** a featured title is currently unavailable, **When** the member views it,
   **Then** the unavailable state is shown instead of an active borrow action.

---

### Edge Cases

- **First-time member (no history)**: All personalized panels (Due Soon, Continue Reading,
  Notifications) show inviting empty states with a next action, never blank boxes or errors.
- **Member not yet affiliated with a local library**: The dashboard still loads with national
  digital content; branch-specific panels prompt the member to select or confirm a home
  library.
- **Slow or offline connection**: Core account information and previously loaded content
  remain readable; the page degrades gracefully rather than failing entirely.
- **Large numbers of alerts or loans**: Lists are capped to a sensible preview with a "view
  all" path, so the dashboard stays scannable.
- **Assistive-technology use**: Every panel, action, and status is reachable and
  understandable via keyboard and screen reader, including urgency indicators that do not
  rely on color alone.
- **Long names, long titles, and non-Latin scripts**: Text wraps or truncates gracefully
  without breaking layout across supported languages.
- **Stale data**: If underlying loan or availability data cannot be refreshed, the member
  sees the last-known state with a clear indication rather than incorrect "live" claims.

## Requirements *(mandatory)*

### Functional Requirements

**Identity & personalization**

- **FR-001**: The dashboard MUST greet the signed-in member by name and display their member
  type (e.g., Student, Teacher, Parent, Community).
- **FR-002**: The dashboard MUST present national-service branding and MUST NOT be tied to a
  single municipality; any location-specific context MUST derive from the member's affiliated
  home library.
- **FR-003**: The system MUST associate each member with a home library and use it to
  populate branch-specific panels (service hours, physical-collection context).

**Navigation & primary actions**

- **FR-004**: The dashboard MUST provide primary actions to browse eBooks and to browse
  physical books, each reachable in a single interaction.
- **FR-005**: The dashboard MUST provide persistent navigation to the member's key areas:
  home, browse eBooks, physical books, my books, due soon, notifications, reading progress,
  and account settings.
- **FR-006**: The dashboard MUST provide a search entry point for books, authors, and
  keywords.
- **FR-007**: The dashboard MUST provide quick links to member support resources (e.g.,
  reserve a book, library rules, user guide, contact support).

**Loans, due dates & alerts**

- **FR-008**: The dashboard MUST show items due soon with a human-readable due date and an
  urgency indicator, and MUST visually distinguish overdue items.
- **FR-009**: The dashboard MUST show a notifications feed of recent account events (e.g.,
  new availability, due-date reminders, return confirmations) with unread indication.
- **FR-010**: Members MUST be able to mark notifications as read (individually and all at
  once), and the change MUST persist across reloads.
- **FR-011**: The dashboard MUST show a count of pending/unread items where relevant (e.g.,
  notifications, due-soon) and keep it consistent with the underlying lists.
- **FR-012**: Long lists (due soon, notifications, featured, continue reading) MUST be capped
  to a preview with a clear "view all" path.

**Discovery & reading continuity**

- **FR-013**: The dashboard MUST show featured titles with title, author, availability
  status, and a borrow action for available titles.
- **FR-014**: The dashboard MUST show in-progress titles with current reading progress and
  allow the member to resume at their last position.
- **FR-015**: For unavailable featured titles, the system MUST show the unavailable state
  instead of an active borrow action.

**Library context**

- **FR-016**: The dashboard MUST show the member's home library service availability (e.g.,
  open/closed status and hours) when a home library is set.

**Accessibility, inclusivity & resilience** *(from constitution Principles I, II, IV, V)*

- **FR-017**: All interactive elements and status information MUST be operable and
  understandable via keyboard and assistive technologies, meeting WCAG 2.1 AA as a baseline;
  urgency and status MUST NOT be conveyed by color alone.
- **FR-018**: The dashboard MUST remain usable on low-cost devices and low-bandwidth
  connections, degrading gracefully when data cannot be refreshed.
- **FR-019**: The interface MUST support presentation in more than one language where
  reasonably achievable, and MUST NOT assume prior technical skill in its labels or flows.
- **FR-020**: The dashboard MUST only display personal account data to the authenticated
  owner of that account, and MUST NOT expose another member's reading or borrowing history.
- **FR-021**: Empty and error states MUST provide a clear, user-friendly next step rather
  than blank panels or raw errors.

### Key Entities *(include if feature involves data)*

- **Member**: A registered user of the national service. Attributes include display name,
  member type, and affiliation to a home library. Owns loans, reading progress, and
  notifications.
- **Home Library**: The local library a member is affiliated with. Provides service hours,
  open/closed status, and physical-collection context shown on the dashboard.
- **Loan**: An item a member currently has out, with a due date and status (active, due soon,
  overdue, returned).
- **Reading Progress**: A member's position within a title they have started (current page /
  total, last-read reference).
- **Title / Catalog Item**: A book or resource (digital or physical) with title, author,
  availability status, and format.
- **Notification**: A time-stamped account event shown to the member, with a read/unread
  state and a category (e.g., new availability, due reminder, return confirmation).
- **Featured Selection**: A curated set of titles surfaced for discovery in the member's
  context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning member can identify their next due item and reach the action to
  address it within 15 seconds of the dashboard loading.
- **SC-002**: 90% of members can locate and start browsing the collection (digital or
  physical) on their first attempt without assistance.
- **SC-003**: Members can resume an in-progress book from the dashboard in 2 interactions or
  fewer.
- **SC-004**: The dashboard's primary content is readable and its main actions usable on a
  low-cost mobile device over a slow connection within a reasonable wait, with no unusable
  blank state.
- **SC-005**: The dashboard passes WCAG 2.1 AA checks for the home view, including full
  keyboard operability and non-color-dependent status indicators.
- **SC-006**: Overdue and due-soon items are correctly distinguished for 100% of members with
  such items, matching the underlying loan records.
- **SC-007**: The dashboard serves members affiliated with any participating library
  nationwide, with no municipality-specific branding or copy on the default experience.
- **SC-008**: A reduction in due-date-related support requests is observed after launch
  (target baseline to be set from pre-launch support volume).

## Assumptions

- The mockup provided depicts the **authenticated member home/landing dashboard** (post
  sign-in), not a public marketing page; this spec covers that authenticated home. A separate
  public/pre-login page, if needed, is out of scope here.
- Authentication and member registration already exist or are provided by a separate feature;
  this dashboard consumes an existing signed-in session.
- "Nationwide" means the service supports many participating local libraries, and each member
  is (or can be) affiliated with one **home library** that supplies branch-specific context;
  national digital content is common to all.
- The original mockup's Binangonan-specific branding, tagline ("Designed for Binangonan
  Residents", "Hybrid Community Library System"), and fixed hours are replaced by
  national-service branding and member-home-library-derived context.
- Featured titles are curated (manually or by the service); the curation mechanism itself is
  out of scope for this dashboard spec.
- Physical-book browsing, full catalog browse, the in-app reader, notification generation, and
  account settings are existing or separately specified surfaces the dashboard links to; this
  spec covers the dashboard's presentation and entry points, not those destinations' internals.
- Standard web/mobile performance and error-handling expectations apply unless stated
  otherwise.

## Out of Scope

- Public (pre-login) marketing/landing page.
- Sign-in, registration, and password recovery flows.
- The internal implementation of browse, reader, reservations, and account-settings
  destinations linked from the dashboard.
- Administrative/librarian dashboards.
- The mechanism for curating featured titles and generating notifications.
