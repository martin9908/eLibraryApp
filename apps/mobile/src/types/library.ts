import type { Timestamp } from 'firebase/firestore';

export type BookType = 'ebook' | 'physical';

export type Book = {
    id: string;
    title: string;
    author: string;
    type: BookType;
    category: string;
    availableCopies: number;
    totalCopies: number;
    /** Legacy: public/Drive URL. Kept only for un-migrated titles. */
    ebookUrl?: string;
    /** Storage object path (e.g. `ebooks/{bookId}.pdf`) for gated titles. */
    ebookStoragePath?: string;
    coverImage?: string;
    createdAt?: Timestamp;
    /** Curated flag — eligible for the Featured panel when true and type === 'ebook'. */
    featured?: boolean;
    /** Owning library (branch) for RBAC scope. */
    libraryId?: string;
    /** Owning library's region, denormalized for scope checks. */
    region?: string;
};

export type BorrowRecord = {
    id: string;
    userId: string;
    bookId: string;
    type: BookType;
    borrowedAt?: Timestamp;
    dueDate?: Timestamp;
    returnedAt?: Timestamp;
    returned: boolean;
};

export type BorrowEntry = BorrowRecord & {
    book: Book | null;
};

/** Member type shown on the dashboard greeting. */
export type MemberType = 'Student' | 'Teacher' | 'Parent' | 'Community';

/** RBAC role hierarchy: admin ⊇ librarian ⊇ patron. */
export type Role = 'patron' | 'librarian' | 'admin';

/** Account lifecycle state; `suspended` denies sign-in and all writes. */
export type AccountStatus = 'active' | 'suspended';

/** A librarian's management scope (libraries and/or a region). */
export type LibrarianScope = {
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/** Authorization claims carried in the Firebase Auth ID token. */
export type RoleClaims = {
    role: Role;
    libs?: string[];
    region?: string;
};

/** Dashboard-relevant fields of the users/{uid} profile document. */
export type UserProfile = {
    homeLibraryId?: string;
    memberType?: MemberType;
    // RBAC mirror (source of truth is the Auth custom claim). Functions-only writes.
    role?: Role;
    status?: AccountStatus;
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/** Weekly service hours for a library branch. */
export type LibraryHours = {
    /** 24h "HH:mm" opening time. */
    open: string;
    /** 24h "HH:mm" closing time. */
    close: string;
    /** Human-readable served days, e.g. "Mon–Sun". */
    days: string;
};

/** A participating local library (branch) in the nationwide service. */
export type Library = {
    id: string;
    name: string;
    region: string;
    hours?: LibraryHours;
    contact?: string;
};

export type NotificationCategory =
    | 'availability'
    | 'dueReminder'
    | 'returnConfirm'
    | 'general';

/** An in-app account event shown in the member's notifications feed. */
export type AppNotification = {
    id: string;
    userId: string;
    category: NotificationCategory;
    title: string;
    body?: string;
    read: boolean;
    createdAt?: Timestamp;
};

/** A member's resume point within a title they have started reading. */
export type ReadingProgress = {
    id: string;
    userId: string;
    bookId: string;
    currentPage: number;
    totalPages: number;
    updatedAt?: Timestamp;
};

/** A Continue Reading row: progress joined with its (possibly missing) book. */
export type ReadingProgressEntry = {
    progress: ReadingProgress;
    book: Book | null;
};

/** A Due Soon row: an active borrow joined with derived urgency metadata. */
export type DueSoonEntry = BorrowEntry & {
    urgency: 'overdue' | 'dueSoon';
    label: string;
    daysLeft: number;
};
