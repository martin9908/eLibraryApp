import {
    type QueryConstraint,
    Timestamp,
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import type { Book, BorrowRecord } from '@/src/types/library';

const BOOKS_COLLECTION = 'books';
const BORROW_RECORDS_COLLECTION = 'borrowRecords';

function mapBook(id: string, raw: Partial<Book>): Book {
    return {
        id,
        title: raw.title ?? 'Untitled',
        author: raw.author ?? 'Unknown author',
        type: raw.type ?? 'ebook',
        category: raw.category ?? 'General',
        availableCopies: raw.availableCopies ?? 0,
        totalCopies: raw.totalCopies ?? 0,
        ebookUrl: raw.ebookUrl,
        coverImage: raw.coverImage,
        createdAt: raw.createdAt,
    };
}

function mapBorrowRecord(id: string, raw: Partial<BorrowRecord>): BorrowRecord {
    return {
        id,
        userId: raw.userId ?? '',
        bookId: raw.bookId ?? '',
        type: raw.type ?? 'ebook',
        borrowedAt: raw.borrowedAt,
        dueDate: raw.dueDate,
        returned: Boolean(raw.returned),
    };
}

export async function getFeaturedEbook(): Promise<Book | null> {
    const booksRef = collection(db, BOOKS_COLLECTION);
    const featuredQuery = query(booksRef, where('type', '==', 'ebook'), limit(20));
    const snapshot = await getDocs(featuredQuery);

    if (snapshot.empty) {
        return null;
    }

    const firstAvailable = snapshot.docs.find((docSnapshot) => {
        const data = docSnapshot.data() as Partial<Book>;
        return (data.availableCopies ?? 0) > 0;
    });

    if (!firstAvailable) {
        return null;
    }

    return mapBook(firstAvailable.id, firstAvailable.data() as Partial<Book>);
}

export async function getBookById(bookId: string): Promise<Book | null> {
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    const snapshot = await getDoc(bookRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapBook(snapshot.id, snapshot.data() as Partial<Book>);
}

export async function getActiveBorrowRecordForUser(userId: string): Promise<BorrowRecord | null> {
    const recordsRef = collection(db, BORROW_RECORDS_COLLECTION);
    const activeBorrowQuery = query(recordsRef, where('userId', '==', userId), limit(20));
    const snapshot = await getDocs(activeBorrowQuery);

    if (snapshot.empty) {
        return null;
    }

    const activeRecord = snapshot.docs.find((docSnapshot) => {
        const data = docSnapshot.data() as Partial<BorrowRecord>;
        return data.returned === false;
    });

    if (!activeRecord) {
        return null;
    }

    return mapBorrowRecord(activeRecord.id, activeRecord.data() as Partial<BorrowRecord>);
}

export async function borrowBook(userId: string, book: Book): Promise<void> {
    const bookRef = doc(db, BOOKS_COLLECTION, book.id);

    await runTransaction(db, async (transaction) => {
        const currentBook = await transaction.get(bookRef);

        if (!currentBook.exists()) {
            throw new Error('Selected book does not exist.');
        }

        const currentData = currentBook.data() as Partial<Book>;
        const availableCopies = currentData.availableCopies ?? 0;

        if (availableCopies <= 0) {
            throw new Error('This title is currently not available.');
        }

        transaction.update(bookRef, {
            availableCopies: increment(-1),
        });
    });

    await addDoc(collection(db, BORROW_RECORDS_COLLECTION), {
        userId,
        bookId: book.id,
        type: book.type,
        borrowedAt: serverTimestamp(),
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        returned: false,
    });
}

export async function returnBook(recordId: string, bookId: string): Promise<void> {
    const recordRef = doc(db, BORROW_RECORDS_COLLECTION, recordId);
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);

    await updateDoc(recordRef, { returned: true });
    await updateDoc(bookRef, { availableCopies: increment(1) });
}

export async function canUserAccessBook(userId: string, bookId: string): Promise<boolean> {
    const recordsRef = collection(db, BORROW_RECORDS_COLLECTION);
    const accessQuery = query(recordsRef, where('userId', '==', userId), limit(50));
    const snapshot = await getDocs(accessQuery);

    return snapshot.docs.some((docSnapshot) => {
        const data = docSnapshot.data() as Partial<BorrowRecord>;
        return data.bookId === bookId && data.returned === false;
    });
}

export async function getAllBooks(filters: {
    type?: Book['type'];
    category?: string;
} = {}): Promise<Book[]> {
    const booksRef = collection(db, BOOKS_COLLECTION);
    const constraints: QueryConstraint[] = [orderBy('title')];

    if (filters.type) {
        constraints.push(where('type', '==', filters.type));
    }
    if (filters.category) {
        constraints.push(where('category', '==', filters.category));
    }

    const snapshot = await getDocs(query(booksRef, ...constraints));
    return snapshot.docs.map((d) => mapBook(d.id, d.data() as Partial<Book>));
}

export async function getActiveBorrowRecordForBook(
    userId: string,
    bookId: string,
): Promise<BorrowRecord | null> {
    const recordsRef = collection(db, BORROW_RECORDS_COLLECTION);
    const q = query(
        recordsRef,
        where('userId', '==', userId),
        where('bookId', '==', bookId),
        limit(10),
    );
    const snapshot = await getDocs(q);
    const active = snapshot.docs.find((d) => !(d.data() as Partial<BorrowRecord>).returned);
    if (!active) return null;
    return mapBorrowRecord(active.id, active.data() as Partial<BorrowRecord>);
}
