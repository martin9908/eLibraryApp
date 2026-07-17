# Contract: Firestore Security Rules (the enforcement boundary)

Rules are the **authoritative** access boundary (FR-007). The client apps only reflect the
role. Authz reads the role/scope from the caller's ID token claims (no extra document
reads). Illustrative contract — not final code.

## Helper predicates

```
function role()        { return request.auth.token.role; }        // 'patron'|'librarian'|'admin'
function isSignedIn()  { return request.auth != null; }
function isActive()    { return isSignedIn() && role() != null; }  // suspended users get no role claim
function isAdmin()     { return isActive() && role() == 'admin'; }
function isLibrarian() { return isActive() && role() == 'librarian'; }

// A librarian's compact scope travels in the token:
//   request.auth.token.libs   -> list<string> assigned library IDs
//   request.auth.token.region -> string assigned region (optional)
function libInScope(libraryId, region) {
  return isAdmin()
      || (isLibrarian() && (
            (request.auth.token.libs != null && libraryId in request.auth.token.libs)
         || (request.auth.token.region != null && region == request.auth.token.region)
         ));
}
```

> A **suspended** account has its role claim cleared by the suspend function, so `isActive()`
> is false and every guarded write/read is denied (FR-014).

## Collection rules (contract)

```
// Catalog: public read; writes gated by role + owning-library scope.
match /books/{bookId} {
  allow read: if true;
  allow create: if libInScope(request.resource.data.libraryId, request.resource.data.region);
  allow update, delete: if libInScope(resource.data.libraryId, resource.data.region);
  // NOTE: delete of a book with active loans is routed through a callable function
  // (multi-doc invariant) — direct delete rule may additionally require no active loans.
}

// User profiles: owner reads/updates own non-privileged fields.
// role/status/scope fields are NEVER client-writable (Functions/Admin SDK only).
match /users/{uid} {
  allow read: if request.auth.uid == uid
              || isAdmin()
              || (isLibrarian() && /* target patron within scope */ true);
  allow update: if request.auth.uid == uid
              && request.resource.data.diff(resource.data)
                   .affectedKeys().hasOnly(['displayName','homeLibraryId','memberType','expoPushToken','updatedAt']);
  allow create: if request.auth.uid == uid
              && request.resource.data.role == 'patron'
              && request.resource.data.status == 'active';
  // Any write touching role/status/assignedLibraryIds/assignedRegion from a client is denied.
}

// Personal collections remain owner-only (reader privacy, from feature 001),
// with admin/scoped-librarian read for support — never widened for patrons.
match /borrowRecords/{id} {
  allow read: if resource.data.userId == request.auth.uid || isAdmin()
              || (isLibrarian() && /* borrower is a patron within scope */ true);
  allow create: if request.resource.data.userId == request.auth.uid; // patrons borrow for themselves
  allow update: if resource.data.userId == request.auth.uid || isAdmin() || isLibrarian();
}

match /notifications/{id}      { allow read: if resource.data.userId == request.auth.uid || isAdmin(); /* mark-read as in 001 */ }
match /readingProgress/{id}    { allow read, write: if resource.data.userId == request.auth.uid; }

// Libraries: readable to signed-in members; writable by admin (or scoped librarian for own branch metadata).
match /libraries/{id} {
  allow read: if isSignedIn();
  allow write: if isAdmin();
}

// Audit log: append + read is server/admin only; never client-writable.
match /auditLog/{id} {
  allow read: if isAdmin();
  allow write: if false; // Cloud Functions (Admin SDK) bypass rules
}
```

## Contract requirements

- **No client path** may set or change `role`, `status`, `assignedLibraryIds`, or
  `assignedRegion` (FR-003/FR-005). Denied by the `users` update `affectedKeys` allow-list.
- **Patron** is denied all `books` writes and all people-management (SC-002).
- **Librarian** writes to `books`/patrons succeed only when the target's `libraryId`/`region`
  is in scope; cross-scope attempts denied (SC-003).
- **Admin** bypasses scope (nationwide) but still cannot write `auditLog` directly.
- These rules are validated with the **Firestore rules emulator** as the primary test gate
  for this feature (see quickstart).
