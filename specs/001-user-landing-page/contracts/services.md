# Contract: Service Layer (client Firestore)

This web app has **no REST API** — the contract surface is the TypeScript service functions in
`apps/web/src/services` that wrap the Firestore client SDK, mirroring the existing
`libraryService.ts` style (async functions returning mapped domain types). Signatures below are
the stable contract the dashboard depends on; bodies belong to implementation/`tasks.md`.

## Extend `libraryService.ts`

```ts
/** Featured eBooks for discovery. Falls back to recent eBooks when none are flagged. */
export function getFeaturedBooks(max?: number): Promise<Book[]>;

/**
 * Active (returned == false) borrow records for a user, joined with their books,
 * classified for the Due Soon panel. `windowDays` defaults to 3.
 */
export function getDueSoon(
  userId: string,
  windowDays?: number,
): Promise<Array<BorrowEntry & { urgency: 'overdue' | 'dueSoon'; label: string; daysLeft: number }>>;
```

Contract notes:
- `getFeaturedBooks` MUST return only `type === 'ebook'`; MUST apply a `limit`; MUST NOT throw on
  empty — returns `[]` (panel renders empty state).
- `getDueSoon` MUST filter to `userId`, MUST exclude returned records, MUST tag overdue vs.
  due-soon per the state-transition rules in `data-model.md`, and MUST be sorted most-urgent
  first. Never surfaces another user's records (FR-020).

## New `libraryBranchService.ts`

```ts
export function getLibraryById(libraryId: string): Promise<Library | null>;

/** Convenience: reads users/{uid}.homeLibraryId then the branch doc. Null when unaffiliated. */
export function getHomeLibrary(userId: string): Promise<Library | null>;

/** Derived open/closed from a Library's hours against the current local time. */
export function isOpenNow(library: Library, now?: Date): boolean;
```

## New `notificationService.ts`

```ts
export function getRecentNotifications(userId: string, max?: number): Promise<Notification[]>;
export function getUnreadCount(userId: string): Promise<number>;
export function markNotificationRead(notificationId: string): Promise<void>;
export function markAllNotificationsRead(userId: string): Promise<void>;
```

Contract notes:
- Reads scoped to `userId`, ordered by `createdAt` desc, `limit` applied (FR-012).
- `markAllNotificationsRead` MUST persist so a reload shows unread count 0 (FR-010).

## New `readingProgressService.ts`

```ts
/** Most-recently-read in-progress titles, joined with book metadata, for Continue Reading. */
export function getContinueReading(
  userId: string,
  max?: number,
): Promise<Array<{ progress: ReadingProgress; book: Book | null }>>;
```

Contract notes:
- Ordered by `updatedAt` desc, `limit` applied. Items missing a resolvable book are dropped
  (defensive), never rendered as broken rows.

## Error / resilience contract (all services)

- Functions reject on transport failure; **callers** (dashboard panels) catch per-panel so one
  failure never blanks the page (research R10, FR-018/FR-021).
- No function returns another user's data; every user-scoped query filters on the passed
  `userId`, which the dashboard always sources from `auth.uid`.
