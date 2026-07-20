import { supabase } from '@/src/lib/supabase';
import { rowToBook, rowToBorrowRecord } from '@/src/lib/supabaseMap';
import type { BookRow, BorrowRecordRow } from '@/src/lib/supabaseMap';
import type { Book, BookType, BorrowRecord, DueSoonEntry } from '@elibrary/types';

/**
 * Fetch a fresh, short-lived read URL for a borrowed eBook via the server gate.
 * The Edge Function re-verifies the loan and returns a signed URL (or a legacy
 * Drive URL). Call this on every open — signed URLs expire quickly.
 *
 * Edge Function contract: `get-ebook-url` accepts `{ bookId }` and returns a
 * body of `{ kind: 'signed'; url; expiresAt } | { kind: 'legacy-drive'; url }`.
 */
export async function getEbookAccessUrl(bookId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke<{ url: string }>('get-ebook-url', {
        body: { bookId },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No eBook URL returned.');
    return data.url;
}

const BOOKS = 'books';
const RECORDS = 'borrow_records';

export async function getAllBooks(filters: { type?: BookType; category?: string } = {}): Promise<Book[]> {
    let q = supabase.from(BOOKS).select('*');
    if (filters.type) q = q.eq('type', filters.type);
    if (filters.category) q = q.eq('category', filters.category);
    const { data, error } = await q;
    if (error) throw error;
    return (data as BookRow[]).map(rowToBook);
}

export async function getBookById(bookId: string): Promise<Book | null> {
    const { data, error } = await supabase.from(BOOKS).select('*').eq('id', bookId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToBook(data as BookRow);
}

export async function getBooksByIds(ids: string[]): Promise<Map<string, Book>> {
    if (ids.length === 0) return new Map();
    const { data, error } = await supabase.from(BOOKS).select('*').in('id', ids);
    if (error) throw error;
    const map = new Map<string, Book>();
    for (const row of data as BookRow[]) {
        const book = rowToBook(row);
        map.set(book.id, book);
    }
    return map;
}

export async function getAllBorrowRecords(userId: string): Promise<BorrowRecord[]> {
    const { data, error } = await supabase.from(RECORDS).select('*').eq('user_id', userId);
    if (error) throw error;
    const records = (data as BorrowRecordRow[]).map(rowToBorrowRecord);
    return records.sort((a, b) => (b.borrowedAt?.seconds ?? 0) - (a.borrowedAt?.seconds ?? 0));
}

export async function getActiveBorrowRecordForBook(
    userId: string,
    bookId: string,
): Promise<BorrowRecord | null> {
    const { data, error } = await supabase
        .from(RECORDS)
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .limit(10);
    if (error) throw error;
    const active = (data as BorrowRecordRow[]).find((r) => !r.returned);
    if (!active) return null;
    return rowToBorrowRecord(active);
}

/**
 * Borrow a title. Copy-count decrement + loan creation are atomic on the
 * server: `borrow_book(p_book_id, p_type, p_due_date)` verifies availability,
 * decrements `available_copies`, and inserts the `borrow_records` row for the
 * calling user (user id derived from the JWT server-side). Throws when the
 * title is unavailable.
 */
export async function borrowBook(userId: string, book: Book): Promise<void> {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.rpc('borrow_book', {
        p_book_id: book.id,
        p_type: book.type,
        p_due_date: dueDate,
    });
    if (error) throw error;
}

/**
 * Return a loan. Marks the record returned and increments the book's
 * `available_copies` atomically on the server via `return_book(p_record_id)`.
 */
export async function returnBook(recordId: string, bookId: string): Promise<void> {
    const { error } = await supabase.rpc('return_book', { p_record_id: recordId });
    if (error) throw error;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Featured eBooks for the dashboard discovery panel. Prefers titles flagged
 * `featured: true`; falls back to any eBooks so the panel is never empty during
 * rollout. Never throws on empty — returns [].
 */
export async function getFeaturedBooks(max = 4): Promise<Book[]> {
    try {
        const { data, error } = await supabase
            .from(BOOKS)
            .select('*')
            .eq('type', 'ebook')
            .eq('featured', true)
            .limit(max);
        if (!error && data && data.length > 0) return (data as BookRow[]).map(rowToBook);
    } catch {
        // Query issue or no matches — fall through to the fallback.
    }
    const { data, error } = await supabase.from(BOOKS).select('*').eq('type', 'ebook').limit(max);
    if (error) throw error;
    return (data as BookRow[]).map(rowToBook);
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
