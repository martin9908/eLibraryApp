import {
    type QueryConstraint,
    Timestamp,
    addDoc,
    collection,
    doc,
    documentId,
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
import type { Book, BorrowRecord, DueSoonEntry } from '@/src/types/library';

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
        returnedAt: raw.returnedAt,
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

    await updateDoc(recordRef, { returned: true, returnedAt: serverTimestamp() });
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

export async function getAllBorrowRecords(userId: string): Promise<BorrowRecord[]> {
    const recordsRef = collection(db, BORROW_RECORDS_COLLECTION);
    const q = query(recordsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((d) =>
        mapBorrowRecord(d.id, d.data() as Partial<BorrowRecord>),
    );
    // Sort newest-first client-side (avoids composite index requirement)
    return records.sort((a, b) => (b.borrowedAt?.seconds ?? 0) - (a.borrowedAt?.seconds ?? 0));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Featured eBooks for the dashboard discovery row. Prefers titles flagged
 * `featured: true`; falls back to any eBooks so the row is never empty during
 * rollout. Never throws on empty — returns [].
 */
export async function getFeaturedBooks(max = 4): Promise<Book[]> {
    const booksRef = collection(db, BOOKS_COLLECTION);
    try {
        const snapshot = await getDocs(
            query(booksRef, where('type', '==', 'ebook'), where('featured', '==', true), limit(max)),
        );
        if (!snapshot.empty) {
            return snapshot.docs.map((d) => mapBook(d.id, d.data() as Partial<Book>));
        }
    } catch {
        // Missing composite index or no matches — fall through to the fallback.
    }
    const fallback = await getDocs(query(booksRef, where('type', '==', 'ebook'), limit(max)));
    return fallback.docs.map((d) => mapBook(d.id, d.data() as Partial<Book>));
}

function dueSoonLabel(daysLeft: number): { urgency: 'overdue' | 'dueSoon'; label: string } {
    if (daysLeft < 0) return { urgency: 'overdue', label: 'Overdue' };
    if (daysLeft === 0) return { urgency: 'dueSoon', label: 'Due today' };
    if (daysLeft === 1) return { urgency: 'dueSoon', label: 'Due tomorrow' };
    return { urgency: 'dueSoon', label: `${daysLeft} days left` };
}

/**
 * Active (returned === false) borrow records classified for the Due Soon panel:
 * overdue (dueDate < now) or due-soon (within `windowDays`). Sorted most urgent
 * first. Scoped to the passed userId — never returns another member's records.
 */
export async function getDueSoon(userId: string, windowDays = 3): Promise<DueSoonEntry[]> {
    const records = (await getAllBorrowRecords(userId)).filter((r) => !r.returned && r.dueDate);
    if (records.length === 0) return [];

    const bookMap = await getBooksByIds(Array.from(new Set(records.map((r) => r.bookId))));
    const now = Date.now();

    const entries: DueSoonEntry[] = [];
    for (const r of records) {
        const dueMs = (r.dueDate?.seconds ?? 0) * 1000;
        const daysLeft = Math.ceil((dueMs - now) / DAY_MS);
        const overdue = dueMs < now;
        if (!overdue && daysLeft > windowDays) continue;
        const { urgency, label } = dueSoonLabel(daysLeft);
        entries.push({ ...r, book: bookMap.get(r.bookId) ?? null, urgency, label, daysLeft });
    }

    return entries.sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function getBooksByIds(ids: string[]): Promise<Map<string, Book>> {
    if (ids.length === 0) return new Map();
    const booksRef = collection(db, BOOKS_COLLECTION);
    // Firestore 'in' supports max 30 values per query
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
    }
    const snapshots = await Promise.all(
        chunks.map((chunk) => getDocs(query(booksRef, where(documentId(), 'in', chunk)))),
    );
    const map = new Map<string, Book>();
    for (const snap of snapshots) {
        for (const d of snap.docs) {
            map.set(d.id, mapBook(d.id, d.data() as Partial<Book>));
        }
    }
    return map;
}
