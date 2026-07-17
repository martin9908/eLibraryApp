# Quickstart & Validation: Member Landing Dashboard (Nationwide)

Runnable validation guide proving the dashboard works end-to-end. Implementation details live in
`tasks.md`; contracts in `contracts/`; schemas in `data-model.md`.

## Prerequisites

- Repo installed: `pnpm install` at repo root.
- Firebase project configured for `apps/web` (`apps/web/.env.local` — see `.env.example`).
- Firestore seeded with:
  - ≥ 5 `books` (some `type: ebook`, some `featured: true`, at least one with
    `availableCopies: 0` to exercise the unavailable state).
  - ≥ 1 `libraries` doc with `hours` (e.g., `{ open: '08:00', close: '20:00', days: 'Mon–Sun' }`).
  - A test user whose `users/{uid}` doc has `homeLibraryId`, `memberType: 'Student'`.
  - For that user: ≥ 1 `borrowRecords` due within 3 days, ≥ 1 overdue, ≥ 1 `notifications`
    (`read: false`), ≥ 1 `readingProgress` doc.

## Run

```bash
# from repo root
pnpm --filter @elibrary/web dev      # starts Next.js on http://localhost:3000
```

Then sign in as the seeded test user and open `http://localhost:3000/dashboard`.

## Static checks

```bash
pnpm --filter @elibrary/web typecheck   # types compile (incl. new @elibrary/types additions)
pnpm lint                               # eslint clean
```

## Validation scenarios (map to spec acceptance)

### US1 — Personalized home (P1)
1. Signed in, open `/dashboard` → greeting shows the member's name + type; Browse eBooks and
   Browse Physical Books actions are present and reach `/catalog`. **(FR-001, FR-004)**
2. Library hours panel reflects the member's **home library** (name + open/closed), not a fixed
   municipality. **(FR-002, FR-003, FR-016, SC-007)**
3. Sign in as a user with **no** loans/history → panels show inviting empty states, no blank
   boxes. **(FR-021, edge case)**
4. Sign out / visit `/dashboard` unauthenticated → redirected to `/login`. **(guard)**

### US2 — Due dates & alerts (P2)
5. Due Soon panel lists the due-within-window item with a human-readable label ("Due tomorrow" /
   "N days left") and shows the overdue item as visually distinct **and** text/icon-labeled (not
   color only). **(FR-008, FR-017)**
6. Notifications panel shows unread items with a count; click "Mark all as read" → count clears;
   reload `/dashboard` → still 0. **(FR-009, FR-010, FR-011)**

### US3 — Discovery & continue reading (P3)
7. Featured panel shows title/author/availability; a book with `availableCopies: 0` shows the
   unavailable state instead of a borrow action. **(FR-013, FR-015)**
8. Continue Reading shows progress (page X of Y); selecting an item opens the reader at the
   stored page. **(FR-014)**

### Cross-cutting
9. **Resilience**: temporarily point the library-hours read at a missing branch id → that panel
   shows a fallback while the rest of the dashboard renders normally. **(FR-018, SC-004)**
10. **Accessibility**: tab through the entire dashboard with keyboard only — every action and the
    mark-all-read control are reachable and focus is visible; run an automated a11y checker
    (e.g., Lighthouse/axe) on `/dashboard` with no critical violations. **(FR-017, SC-005)**
11. **Privacy**: signed in as user A, confirm no user B loans/notifications/progress ever appear;
    Firestore rules reject a cross-user read. **(FR-020)**

## Expected outcome

All 11 scenarios pass; typecheck + lint clean; `/dashboard` is the nationwide authenticated home
with no municipality-specific branding on the default experience.
