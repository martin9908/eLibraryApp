/**
 * @elibrary/types
 * Shared domain types used across mobile (Expo) and web (Next.js) apps.
 *
 * Uses a structural Timestamp interface so this package has zero runtime
 * dependencies — consumers can substitute firebase/firestore's Timestamp class
 * which is structurally compatible.
 */

export type BookType = 'ebook' | 'physical';

/** Structural interface compatible with firebase/firestore Timestamp. */
export interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
}

export type Book = {
    id: string;
    title: string;
    author: string;
    type: BookType;
    category: string;
    availableCopies: number;
    totalCopies: number;
    ebookUrl?: string;
    coverImage?: string;
    createdAt?: FirestoreTimestamp;
    /** Curated flag — when true and type === 'ebook', eligible for the Featured panel. */
    featured?: boolean;
    /** Owning library (branch) — determines which librarians may manage this item (RBAC). */
    libraryId?: string;
    /** Owning library's region, denormalized for scope checks in security rules. */
    region?: string;
};

export type BorrowRecord = {
    id: string;
    userId: string;
    bookId: string;
    type: BookType;
    borrowedAt?: FirestoreTimestamp;
    dueDate?: FirestoreTimestamp;
    returnedAt?: FirestoreTimestamp;
    returned: boolean;
};

export type BorrowEntry = BorrowRecord & {
    book: Book | null;
};

/** Member type shown on the dashboard greeting. */
export type MemberType = 'Student' | 'Teacher' | 'Parent' | 'Community';

// ─── RBAC (feature 002) ──────────────────────────────────────────────────────

/** Role hierarchy: admin ⊇ librarian ⊇ patron. */
export type Role = 'patron' | 'librarian' | 'admin';

/** Account lifecycle state; `suspended` denies sign-in and all writes. */
export type AccountStatus = 'active' | 'suspended';

/**
 * A librarian's management scope. A librarian may act on a target when the
 * target's library is in `assignedLibraryIds` OR the target's library region
 * equals `assignedRegion`. Admins ignore scope (nationwide).
 */
export type LibrarianScope = {
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/**
 * The authorization claims carried in the Firebase Auth ID token (source of
 * truth for authz). Compact by design so security rules can read them cheaply.
 */
export type RoleClaims = {
    role: Role;
    /** Assigned library IDs (librarian only). */
    libs?: string[];
    /** Assigned region (librarian only). */
    region?: string;
};

/** An audit-log entry — written only by Cloud Functions. */
export type AuditEntry = {
    id: string;
    actorUid: string;
    actorRole: Role;
    /** e.g. 'role.assign', 'role.revoke', 'patron.suspend', 'book.delete'. */
    action: string;
    targetType: 'user' | 'book' | 'library';
    targetId: string;
    details?: Record<string, unknown>;
    createdAt?: FirestoreTimestamp;
};

/**
 * A member's profile document (users/{uid}). The document also carries fields
 * owned by other features (e.g. expoPushToken); only dashboard-relevant fields
 * are typed here.
 */
export type UserProfile = {
    /** FK → libraries/{id}. Unset → member has not chosen a home library yet. */
    homeLibraryId?: string;
    /** Falls back to a generic "Member" label when unset. */
    memberType?: MemberType;
    // RBAC mirror (source of truth is the Auth custom claim). Functions-only writes.
    /** Mirror of the role claim, for querying/UI. Defaults 'patron'. */
    role?: Role;
    /** `suspended` denies sign-in and all writes. Defaults 'active'. */
    status?: AccountStatus;
    /** Librarian scope — libraries this librarian may manage. */
    assignedLibraryIds?: string[];
    /** Librarian scope — region this librarian may manage (all its libraries). */
    assignedRegion?: string;
};

/** Weekly service hours for a library branch. */
export type LibraryHours = {
    /** 24h "HH:mm" opening time, e.g. "08:00". */
    open: string;
    /** 24h "HH:mm" closing time, e.g. "20:00". */
    close: string;
    /** Human-readable served days, e.g. "Mon–Sun". */
    days: string;
};

/** A participating local library (branch) in the nationwide service. */
export type Library = {
    id: string;
    name: string;
    /** Province/region for nationwide grouping. */
    region: string;
    hours?: LibraryHours;
    /** Support contact (phone/email) shown in the hours panel. */
    contact?: string;
};

export type NotificationCategory =
    | 'availability'
    | 'dueReminder'
    | 'returnConfirm'
    | 'general';

/** An in-app account event shown in the member's notifications feed. */
export type Notification = {
    id: string;
    userId: string;
    category: NotificationCategory;
    title: string;
    body?: string;
    read: boolean;
    createdAt?: FirestoreTimestamp;
};

/** A member's resume point within a title they have started reading. */
export type ReadingProgress = {
    id: string;
    userId: string;
    bookId: string;
    currentPage: number;
    totalPages: number;
    updatedAt?: FirestoreTimestamp;
};

/** A Continue Reading row: progress joined with its (possibly missing) book. */
export type ReadingProgressEntry = {
    progress: ReadingProgress;
    book: Book | null;
};

/** A Due Soon row: an active borrow joined with derived urgency metadata. */
export type DueSoonEntry = BorrowEntry & {
    urgency: 'overdue' | 'dueSoon';
    /** Human-readable urgency label, e.g. "Overdue", "Due tomorrow", "3 days left". */
    label: string;
    /** Whole days until due; negative when overdue. */
    daysLeft: number;
};
