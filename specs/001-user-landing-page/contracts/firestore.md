# Contract: Firestore Collections & Security Rules

The persistence contract. Existing collections (`books`, `borrowRecords`, `users`) are reused;
new collections are additive. Field-level schemas are in `data-model.md`.

## Collections

| Collection | New? | Doc shape (key fields) | Dashboard access |
|------------|------|------------------------|------------------|
| `books` | extend | + `featured?: boolean` | read (featured query, book joins) |
| `borrowRecords` | reuse | `userId, bookId, dueDate, returned` | read (due-soon, active loans) |
| `users` | extend | + `homeLibraryId?`, `memberType?` | read own profile |
| `libraries` | **new** | `name, region, hours?, contact?` | read (home-library hours) |
| `notifications` | **new** | `userId, category, title, body?, read, createdAt` | read + update (mark read) |
| `readingProgress` | **new** | `userId, bookId, currentPage, totalPages, updatedAt` | read (continue reading) |

## Required indexes

- `notifications`: composite (`userId` ==, `createdAt` desc).
- `readingProgress`: composite (`userId` ==, `updatedAt` desc).
- `borrowRecords`: existing `userId` == query is sufficient (client-side classification of
  due-soon/overdue; no server range query required).
- `books`: composite (`type` ==, `featured` ==) for the featured query.

## Security rules (enforcement gate — Constitution Principle IV, FR-020)

Rules MUST enforce owner-only access for personal data. Illustrative contract (not final code):

```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /borrowRecords/{id} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
}
match /notifications/{id} {
  allow read, update: if request.auth != null && resource.data.userId == request.auth.uid;
  // update limited to the `read` field (mark-read); no cross-user writes.
}
match /readingProgress/{id} {
  allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
}
match /libraries/{id} {
  allow read: if request.auth != null;   // branch info is non-personal, readable to signed-in members
  allow write: if false;                  // managed out-of-band (admin), not by this feature
}
match /books/{id} {
  allow read: if true;                    // catalog is public per existing behavior
}
```

Contract requirements:
- No dashboard query may return another member's `borrowRecords`, `notifications`, or
  `readingProgress`.
- Mark-read updates MUST be constrained to the `read` field.
- Rules are verified as an implementation gate before this feature is considered done.
