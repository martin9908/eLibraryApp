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
