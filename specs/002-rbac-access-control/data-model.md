# Phase 1 Data Model: Role-Based Access Control

Types centralized in `@elibrary/types` (mobile mirrors as needed). Firestore is the store;
the authoritative **role** also lives in the Firebase Auth custom claim. Changes are
additive to existing entities.

## Enumerations

```
Role          = 'patron' | 'librarian' | 'admin'
AccountStatus = 'active' | 'suspended'
```

Capability hierarchy: **admin ⊇ librarian ⊇ patron** (higher roles include all lower
capabilities).

## Auth custom claims (per user, in the ID token)

| Claim | Type | Notes |
|-------|------|-------|
| `role` | Role | Authorization source of truth; set only by Cloud Functions (Admin SDK). |
| `libs` | string[] (compact) | Librarian's assigned library IDs (omitted/empty for patron; ignored for admin). |
| `region` | string? | Librarian's assigned region, if region-scoped. |

Claims are read in rules via `request.auth.token.role` etc., and on the client via
`getIdTokenResult()`.

## Extended entity: User (`users/{uid}`)

Existing fields (homeLibraryId, memberType, expoPushToken) unchanged. **Added:**

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `role` | Role | yes | Mirror of the claim, for querying/UI. Written only by Functions. Defaults `patron`. |
| `status` | AccountStatus | yes | `active` by default; `suspended` denies all actions. Functions-only write. |
| `assignedLibraryIds` | string[] | librarian | Libraries the librarian may manage. |
| `assignedRegion` | string? | librarian | Region the librarian may manage (covers all its libraries). |

Validation:
- FR-002: on creation, `role='patron'`, `status='active'`.
- FR-003/FR-005: `role`, `status`, `assignedLibraryIds`, `assignedRegion` are **not**
  client-writable (rules deny); only Cloud Functions mutate them.
- A librarian with neither `assignedLibraryIds` nor `assignedRegion` has no scoped
  management ability (edge case: unassigned librarian).

## Extended entity: Book (`books/{id}`)

| Field | Type | Required | Rules / Notes |
|-------|------|----------|---------------|
| `libraryId` | string | yes (for scoped mgmt) | Owning library; determines which librarians may manage the item. |
| `region` | string? | derived | Owning library's region, denormalized for scope checks in rules (optional). |

Existing fields unchanged. Books remain publicly readable; **writes** become role/scope
gated (patron: never; librarian: only if `libraryId` in scope; admin: always).

## Reused entity: Library (`libraries/{id}`)

Existing `region` field becomes the basis for region-scoped librarian authority. No new
fields required.

## New entity: Audit entry (`auditLog/{id}`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `actorUid` | string | yes | Who performed the action. |
| `actorRole` | Role | yes | Actor's role at action time. |
| `action` | string | yes | e.g. `role.assign`, `role.revoke`, `patron.suspend`, `book.delete`. |
| `targetType` | string | yes | `user` \| `book` \| `library`. |
| `targetId` | string | yes | Affected entity id. |
| `details` | map | no | Before/after or scope context. |
| `createdAt` | Timestamp | yes | Server timestamp. |

Written **only** by Cloud Functions; readable by admins (and optionally librarians for
their scope). Never client-writable.

## Relationships

```text
User.role (claim + mirror) ── governs ─▶ every read/write decision
User(librarian).assignedLibraryIds ─▶ Library(ies) the librarian manages
User(librarian).assignedRegion ─────▶ all Libraries with that region
Book.libraryId ─────────────────────▶ Library (owning branch → scope check)
Patron(User).homeLibraryId ─────────▶ Library (which librarian may manage the patron)
Cloud Function (privileged) ── writes ▶ User.role/status/scope, auditLog
```

## Authorization matrix (capabilities)

| Capability | Patron | Librarian (in scope) | Admin |
|------------|:------:|:--------------------:|:-----:|
| Browse / search catalog | ✅ | ✅ | ✅ |
| Borrow / return / read | ✅ | ✅ | ✅ |
| Manage own account/profile | ✅ | ✅ | ✅ |
| Create/edit/remove inventory | ❌ | ✅ (own library/region) | ✅ (nationwide) |
| View/manage patrons | ❌ | ✅ (own library/region) | ✅ (nationwide) |
| Assign/revoke Librarian role + scope | ❌ | ❌ | ✅ |
| Assign/revoke Admin role | ❌ | ❌ | ✅ |
| Suspend/reactivate accounts | ❌ | ✅ (patrons in scope) | ✅ (any) |
| Read audit log | ❌ | ▲ (own scope, optional) | ✅ |

Admin bypasses scope; librarian is bounded by scope; patron has no management.

## State transitions

### Role
```
patron ──(admin assigns)──▶ librarian ──(admin assigns)──▶ admin
  ▲                             │                             │
  └──────(admin revokes)────────┴───────(admin revokes*)──────┘
* revoking/demoting the last admin is refused (FR-012 / SC-006)
```

### Account status
```
active ──(librarian/admin suspends)──▶ suspended ──(reactivate)──▶ active
suspended ⇒ sign-in blocked and all writes denied (FR-014)
```
