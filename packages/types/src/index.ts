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
