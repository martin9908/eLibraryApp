# Phase 1 Data Model: Member Landing Dashboard (Nationwide)

Types are centralized in `@elibrary/types` (zero-runtime-dependency, structural `FirestoreTimestamp`
already defined there). Firestore is the store. Existing entities `Book` and `BorrowRecord`
are reused; changes below are additive.

## Existing entities (reused)

### Book (extended)
Existing fields unchanged. **New optional field:**

| Field | Type | Notes |
|-------|------|-------|
| `featured` | `boolean?` | Curated flag. When true and `type === 'ebook'`, eligible for the Featured panel. |

### BorrowRecord (reused as-is)
Source of Due Soon / Overdue / active-loan panels. Relevant fields: `userId`, `bookId`,
`dueDate`, `returned`. **Derived, not stored:** loan urgency status (see State Transitions).

## New entities

### Library (branch)
Represents a participating local library nationwide. Collection: `libraries`.

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `id` | string | yes | Firestore doc id. |
| `name` | string | yes | Display name (e.g., "Quezon City Public Library"). |
| `region` | string | yes | Province/region for nationwide grouping. |
| `hours` | `LibraryHours` | no | Weekly service hours (see below). Absent → "hours unavailable". |
| `contact` | string | no | Support contact / phone / email shown in the hours panel. |

`LibraryHours` (embedded): `{ open: string; close: string; days: string }` (e.g.,
`{ open: '08:00', close: '20:00', days: 'Mon–Sun' }`). Open-now is **derived** by comparing
current local time against `open`/`close`.

### UserProfile (extends existing `users/{uid}` document)
The `users` doc already exists (holds `expoPushToken`). **New field:**

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `homeLibraryId` | string? | no | FK → `libraries/{id}`. Unset → branch panels prompt member to choose a home library. |
| `memberType` | string? | no | One of Student \| Teacher \| Parent \| Community. Falls back to "Member" when unset. Display name comes from Firebase Auth `displayName`. |

### Notification
In-app account event feed. Collection: `notifications`.

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `id` | string | yes | Doc id. |
| `userId` | string | yes | FK → owner. All queries scoped to `auth.uid`. |
| `category` | `'availability' \| 'dueReminder' \| 'returnConfirm' \| 'general'` | yes | Drives icon/label; not color-only. |
| `title` | string | yes | Short headline. |
| `body` | string | no | Detail line. |
| `read` | boolean | yes | Defaults false. Toggled by mark-read actions. |
| `createdAt` | FirestoreTimestamp | yes | Ordering key (desc). |

### ReadingProgress
Continue-reading resume points. Collection: `readingProgress`.

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `id` | string | yes | Doc id (recommend composite `${userId}_${bookId}`). |
| `userId` | string | yes | FK → owner. Scoped to `auth.uid`. |
| `bookId` | string | yes | FK → `books/{id}`. |
| `currentPage` | number | yes | ≥ 1. |
| `totalPages` | number | yes | ≥ `currentPage`. |
| `updatedAt` | FirestoreTimestamp | yes | Ordering key (desc) for "most recently read". |

## Relationships

```text
UserProfile (users/{uid})
  ├── homeLibraryId ────────────► Library (libraries/{id})
  ├── (uid) ◄── userId ────────── BorrowRecord (borrowRecords)  ──► Book (books)
  ├── (uid) ◄── userId ────────── Notification (notifications)
  └── (uid) ◄── userId ────────── ReadingProgress (readingProgress) ──► Book (books)

Book.featured=true & type=ebook ─► Featured panel
```

## Validation rules (from spec requirements)

- **FR-001/FR-003**: greeting requires Auth `displayName`; `memberType` and `homeLibraryId`
  degrade gracefully when unset ("Member" / choose-library prompt).
- **FR-008**: a `BorrowRecord` with `returned == false` and a `dueDate` is classified for the
  Due Soon panel; overdue MUST be visually distinct.
- **FR-010/FR-011**: unread count = count of `notifications` with `read == false`; mark-read
  MUST persist (Firestore `updateDoc`) and the count MUST stay consistent with the list.
- **FR-012**: every list (due soon, notifications, featured, continue reading) is capped with a
  `limit` and a "view all" link.
- **FR-013/FR-015**: featured item shows title/author/availability; borrow action only when
  `availableCopies > 0`, else unavailable state.
- **FR-014**: continue-reading item shows `currentPage`/`totalPages` and resumes at page.
- **FR-020**: every query filters on `userId == auth.uid`; enforced by security rules (see
  `contracts/firestore.md`).

## State transitions

### Loan urgency (derived from `BorrowRecord`, not persisted)

```text
returned == true                         → not shown on dashboard
returned == false & dueDate < now        → OVERDUE   (distinct, urgent styling + text/icon)
returned == false & 0 ≤ dueDate-now ≤ 3d → DUE SOON  (urgency label: "Due tomorrow" / "N days left")
returned == false & dueDate-now > 3d     → active, not surfaced in Due Soon preview
```

### Notification read-state

```text
created                → read = false (contributes to unread count)
mark-one-read          → read = true  (count −1)
mark-all-read (FR-010) → all read = true (count → 0), persisted across reload
```
