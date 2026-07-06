# Contract: UI (route, layout, components)

Application UI contract for the member dashboard. Components are React 19 client components in
`apps/web/src/components/dashboard/`, styled with existing `globals.css` classes + additive
dashboard styles. Reuses `useAuth()` and the shared `@elibrary/theme` tokens.

## Route

- **Path**: `/dashboard` (`apps/web/app/dashboard/page.tsx`), `'use client'`.
- **Guard**: while `initialising` → spinner; if `!user` → redirect to `/login` (same pattern as
  `app/account/page.tsx`). Authenticated members are directed here post-login.

## Page regions (maps to the mockup, nationwide-adapted)

| Region | Component | Backing data | Requirements |
|--------|-----------|--------------|--------------|
| Header/search/user | existing NavBar (extended) | `useAuth()` | FR-006 search entry, FR-001 identity |
| Welcome banner | `WelcomeBanner` | Auth `displayName`, `memberType` | FR-001 |
| Primary actions | `BrowseActions` | static links → `/catalog` | FR-004 |
| Featured eBooks | `FeaturedRow` | `getFeaturedBooks()` | FR-013, FR-015, FR-012 |
| Continue Reading | `ContinueReading` | `getContinueReading()` | FR-014, FR-012 |
| Notifications | `NotificationsPanel` | `getRecentNotifications()`, mark-read | FR-009/010/011, FR-012 |
| Due Soon | `DueSoonPanel` | `getDueSoon()` | FR-008, FR-012 |
| Library hours | `LibraryHours` | `getHomeLibrary()`, `isOpenNow()` | FR-016, FR-003 |
| Quick links | `QuickLinks` | static links | FR-007 |

## Component prop contracts (shapes, not implementations)

```ts
WelcomeBanner:      { displayName: string; memberType: string }
BrowseActions:      {}                                   // links to /catalog (ebook & physical filters)
FeaturedRow:        { books: Book[]; loading: boolean }  // reuses existing BookCard
ContinueReading:    { items: Array<{ progress: ReadingProgress; book: Book | null }>; loading: boolean }
NotificationsPanel: { items: Notification[]; unread: number; loading: boolean;
                      onMarkAll: () => void; onMarkOne: (id: string) => void }
DueSoonPanel:       { items: Array<BorrowEntry & { urgency; label; daysLeft }>; loading: boolean }
LibraryHours:       { library: Library | null; loading: boolean }  // null → "choose home library" prompt
QuickLinks:         {}                                   // reserve / rules / user guide / contact
```

## Cross-cutting UI requirements

- **Per-panel isolation** (research R10): each panel owns its `loading` / `empty` / `error`
  state; a single failing panel MUST NOT blank the dashboard (FR-018, FR-021, SC-004).
- **Empty states** (FR-021): first-time member sees inviting empty states with a next action in
  Due Soon, Continue Reading, Notifications — never blank boxes or raw errors.
- **Accessibility** (FR-017, SC-005): semantic landmarks (`header`/`nav`/`main`/`aside`),
  keyboard operability, visible focus, `aria-live` on the unread count, and urgency conveyed by
  text/icon (not color alone). Covers have `alt` text.
- **Nationwide** (FR-002, SC-007): no municipality-specific branding/copy; branch context comes
  only from the member's `homeLibrary`. Default (unaffiliated) experience shows national content
  + a "choose your library" prompt.
- **Strings** (FR-019, research R8): all copy sourced from a centralized strings module — no
  scattered inline literals — so a locale layer can be added later; layout tolerates longer text.
- **List caps** (FR-012): Featured, Continue Reading, Notifications, Due Soon each render a
  bounded preview with a "View All →" link to the relevant existing route.

## Acceptance mapping

- US1 → WelcomeBanner + BrowseActions + LibraryHours (+ guard/redirect).
- US2 → DueSoonPanel + NotificationsPanel (mark-read persistence).
- US3 → FeaturedRow + ContinueReading (resume link into existing reader).
