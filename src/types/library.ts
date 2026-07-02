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
    ebookUrl?: string;
    coverImage?: string;
    createdAt?: Timestamp;
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
