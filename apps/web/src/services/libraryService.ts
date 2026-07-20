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

import { httpsCallable } from 'firebase/functions';

import { db, functions } from '@/src/lib/firebase';
import type { Book, BookType, BorrowRecord, DueSoonEntry } from '@elibrary/types';

type GetEbookUrlResult =
    | { kind: 'signed'; url: string; expiresAt: number }
    | { kind: 'legacy-drive'; url: string };

/**
 * Fetch a fresh, short-lived read URL for a borrowed eBook via the server gate.
 * The Cloud Function re-verifies the loan and returns a signed URL (or a legacy
 * Drive URL). Call this on every open — signed URLs expire quickly.
 */
export async function getEbookAccessUrl(bookId: string): Promise<string> {
    const callable = httpsCallable<{ bookId: string }, GetEbookUrlResult>(functions, 'getEbookUrl');
    const { data } = await callable({ bookId });
    return data.url;
}

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
        ebookStoragePath: raw.ebookStoragePath,
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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Featured eBooks for the dashboard discovery panel. Prefers titles flagged
 * `featured: true`; falls back to any eBooks so the panel is never empty during
 * rollout. Never throws on empty — returns [].
 */
export async function getFeaturedBooks(max = 4): Promise<Book[]> {
    const ref = collection(db, BOOKS);
    try {
        const snap = await getDocs(
            query(ref, where('type', '==', 'ebook'), where('featured', '==', true), limit(max)),
        );
        if (!snap.empty) return snap.docs.map((d) => mapBook(d.id, d.data() as Partial<Book>));
    } catch {
        // Missing composite index or no matches — fall through to the fallback.
    }
    const fallback = await getDocs(query(ref, where('type', '==', 'ebook'), limit(max)));
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
        const dueMs = (r.dueDate!.seconds ?? 0) * 1000;
        const daysLeft = Math.ceil((dueMs - now) / DAY_MS);
        const overdue = dueMs < now;
        // Show only overdue items or items due within the reminder window.
        if (!overdue && daysLeft > windowDays) continue;
        const { urgency, label } = dueSoonLabel(daysLeft);
        entries.push({ ...r, book: bookMap.get(r.bookId) ?? null, urgency, label, daysLeft });
    }

    return entries.sort((a, b) => a.daysLeft - b.daysLeft);
}
