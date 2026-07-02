import {
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    increment,
    limit,
    query,
    runTransaction,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import type { Book, BookType, BorrowRecord } from '@elibrary/types';

const BOOKS = 'books';
const RECORDS = 'borrowRecords';

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
    };
}

function mapRecord(id: string, raw: Record<string, unknown>): BorrowRecord {
    return {
        id,
        userId: (raw.userId as string) ?? '',
        bookId: (raw.bookId as string) ?? '',
        type: (raw.type as BookType) ?? 'ebook',
        borrowedAt: raw.borrowedAt as BorrowRecord['borrowedAt'],
        dueDate: raw.dueDate as BorrowRecord['dueDate'],
        returnedAt: raw.returnedAt as BorrowRecord['returnedAt'],
        returned: Boolean(raw.returned),
    };
}

export async function getAllBooks(filters: { type?: BookType; category?: string } = {}): Promise<Book[]> {
    const ref = collection(db, BOOKS);
    const constraints = [];
    if (filters.type) constraints.push(where('type', '==', filters.type));
    if (filters.category) constraints.push(where('category', '==', filters.category));
    const snap = await getDocs(constraints.length ? query(ref, ...constraints) : query(ref));
    return snap.docs.map((d) => mapBook(d.id, d.data() as Partial<Book>));
}

export async function getBookById(bookId: string): Promise<Book | null> {
    const snap = await getDoc(doc(db, BOOKS, bookId));
    if (!snap.exists()) return null;
    return mapBook(snap.id, snap.data() as Partial<Book>);
}

export async function getBooksByIds(ids: string[]): Promise<Map<string, Book>> {
    if (ids.length === 0) return new Map();
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
    const snapshots = await Promise.all(
        chunks.map((chunk) => getDocs(query(collection(db, BOOKS), where(documentId(), 'in', chunk)))),
    );
    const map = new Map<string, Book>();
    for (const snap of snapshots) {
        for (const d of snap.docs) map.set(d.id, mapBook(d.id, d.data() as Partial<Book>));
    }
    return map;
}

export async function getAllBorrowRecords(userId: string): Promise<BorrowRecord[]> {
    const q = query(collection(db, RECORDS), where('userId', '==', userId));
    const snap = await getDocs(q);
    const records = snap.docs.map((d) => mapRecord(d.id, d.data() as Record<string, unknown>));
    return records.sort((a, b) => ((b.borrowedAt?.seconds ?? 0) - (a.borrowedAt?.seconds ?? 0)));
}

export async function getActiveBorrowRecordForBook(
    userId: string,
    bookId: string,
): Promise<BorrowRecord | null> {
    const q = query(
        collection(db, RECORDS),
        where('userId', '==', userId),
        where('bookId', '==', bookId),
        limit(10),
    );
    const snap = await getDocs(q);
    const active = snap.docs.find((d) => !(d.data() as { returned?: boolean }).returned);
    if (!active) return null;
    return mapRecord(active.id, active.data() as Record<string, unknown>);
}

export async function borrowBook(userId: string, book: Book): Promise<void> {
    const bookRef = doc(db, BOOKS, book.id);
    await runTransaction(db, async (tx) => {
        const snap = await tx.get(bookRef);
        if (!snap.exists()) throw new Error('Book does not exist.');
        const available = (snap.data().availableCopies as number) ?? 0;
        if (available <= 0) throw new Error('This title is currently not available.');
        tx.update(bookRef, { availableCopies: increment(-1) });
    });
    const { addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, RECORDS), {
        userId,
        bookId: book.id,
        type: book.type,
        borrowedAt: serverTimestamp(),
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        returned: false,
    });
}

export async function returnBook(recordId: string, bookId: string): Promise<void> {
    await updateDoc(doc(db, RECORDS, recordId), { returned: true, returnedAt: serverTimestamp() });
    await updateDoc(doc(db, BOOKS, bookId), { availableCopies: increment(1) });
}
