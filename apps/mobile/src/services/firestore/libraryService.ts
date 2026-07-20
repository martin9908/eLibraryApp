import { supabase } from '@/src/lib/supabase';
import { rowToBook, rowToBorrowRecord } from '@/src/lib/supabaseMap';
import type { BookRow, BorrowRecordRow } from '@/src/lib/supabaseMap';
import type { Book, BorrowRecord, DueSoonEntry } from '@/src/types/library';

type GetEbookUrlResult =
    | { kind: 'signed'; url: string; expiresAt: number }
    | { kind: 'legacy-drive'; url: string };

const BOOKS_TABLE = 'books';
const BORROW_RECORDS_TABLE = 'borrow_records';

export async function getFeaturedEbook(): Promise<Book | null> {
    const { data, error } = await supabase
        .from(BOOKS_TABLE)
        .select('*')
        .eq('type', 'ebook')
        .limit(20);
    if (error) throw error;

    if (!data || data.length === 0) {
        return null;
    }

    const firstAvailable = (data as BookRow[]).find((row) => (row.available_copies ?? 0) > 0);

    if (!firstAvailable) {
        return null;
    }

    return rowToBook(firstAvailable);
}

export async function getBookById(bookId: string): Promise<Book | null> {
    const { data, error } = await supabase
        .from(BOOKS_TABLE)
        .select('*')
        .eq('id', bookId)
        .maybeSingle();
    if (error) throw error;

    if (!data) {
        return null;
    }

    return rowToBook(data as BookRow);
}

export async function getActiveBorrowRecordForUser(userId: string): Promise<BorrowRecord | null> {
    const { data, error } = await supabase
        .from(BORROW_RECORDS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .limit(20);
    if (error) throw error;

    if (!data || data.length === 0) {
        return null;
    }

    const activeRecord = (data as BorrowRecordRow[]).find((row) => row.returned === false);

    if (!activeRecord) {
        return null;
    }

    return rowToBorrowRecord(activeRecord);
}

/**
 * Borrow a title. Copy-count decrement + loan creation happen atomically in the
 * `borrow_book` RPC (server-side), which reads the borrower from auth.uid().
 * Expected params: { p_book_id: text, p_type: book_type, p_due_date: timestamptz }.
 */
export async function borrowBook(userId: string, book: Book): Promise<void> {
    // Due 7 days out — the server RPC persists this on the new loan row.
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.rpc('borrow_book', {
        p_book_id: book.id,
        p_type: book.type,
        p_due_date: dueDate,
    });
    if (error) throw error;
    // `userId` is derived server-side from the session; kept in the signature
    // for source-compatibility with existing callers.
    void userId;
}

/**
 * Return a loan. Marks the record returned + restores the copy count atomically
 * in the `return_book` RPC (server-side).
 * Expected params: { p_record_id: text }.
 */
export async function returnBook(recordId: string, bookId: string): Promise<void> {
    const { error } = await supabase.rpc('return_book', {
        p_record_id: recordId,
    });
    if (error) throw error;
    // `bookId` is resolved from the record server-side; kept for signature parity.
    void bookId;
}

export async function canUserAccessBook(userId: string, bookId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from(BORROW_RECORDS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .limit(50);
    if (error) throw error;

    return (data as BorrowRecordRow[] | null ?? []).some(
        (row) => row.book_id === bookId && row.returned === false,
    );
}

/**
 * Fetch a fresh, short-lived read URL for a borrowed eBook via the server gate.
 * The Edge Function re-verifies the loan and returns a signed URL (or a legacy
 * Drive URL). Call this on every open — signed URLs expire quickly.
 */
export async function getEbookAccessUrl(bookId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke<GetEbookUrlResult>('get-ebook-url', {
        body: { bookId },
    });
    if (error) throw error;
    return data!.url;
}

export async function getAllBooks(filters: {
    type?: Book['type'];
    category?: string;
} = {}): Promise<Book[]> {
    let request = supabase.from(BOOKS_TABLE).select('*').order('title');

    if (filters.type) {
        request = request.eq('type', filters.type);
    }
    if (filters.category) {
        request = request.eq('category', filters.category);
    }

    const { data, error } = await request;
    if (error) throw error;
    return (data as BookRow[] | null ?? []).map((row) => rowToBook(row));
}

export async function getActiveBorrowRecordForBook(
    userId: string,
    bookId: string,
): Promise<BorrowRecord | null> {
    const { data, error } = await supabase
        .from(BORROW_RECORDS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .limit(10);
    if (error) throw error;

    const active = (data as BorrowRecordRow[] | null ?? []).find((row) => !row.returned);
    if (!active) return null;
    return rowToBorrowRecord(active);
}

export async function getAllBorrowRecords(userId: string): Promise<BorrowRecord[]> {
    const { data, error } = await supabase
        .from(BORROW_RECORDS_TABLE)
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;

    const records = (data as BorrowRecordRow[] | null ?? []).map((row) => rowToBorrowRecord(row));
    // Sort newest-first client-side (avoids relying on a composite index)
    return records.sort((a, b) => (b.borrowedAt?.seconds ?? 0) - (a.borrowedAt?.seconds ?? 0));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Featured eBooks for the dashboard discovery row. Prefers titles flagged
 * `featured: true`; falls back to any eBooks so the row is never empty during
 * rollout. Never throws on empty — returns [].
 */
export async function getFeaturedBooks(max = 4): Promise<Book[]> {
    try {
        const { data, error } = await supabase
            .from(BOOKS_TABLE)
            .select('*')
            .eq('type', 'ebook')
            .eq('featured', true)
            .limit(max);
        if (error) throw error;
        if (data && data.length > 0) {
            return (data as BookRow[]).map((row) => rowToBook(row));
        }
    } catch {
        // No matches (or a transient error) — fall through to the fallback.
    }
    const { data: fallback } = await supabase
        .from(BOOKS_TABLE)
        .select('*')
        .eq('type', 'ebook')
        .limit(max);
    return (fallback as BookRow[] | null ?? []).map((row) => rowToBook(row));
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
    // Chunk to keep the `in` filter (and request URL) a sane size — mirrors the
    // old Firestore 30-value cap on `in` queries.
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
    }
    const results = await Promise.all(
        chunks.map((chunk) => supabase.from(BOOKS_TABLE).select('*').in('id', chunk)),
    );
    const map = new Map<string, Book>();
    for (const { data, error } of results) {
        if (error) throw error;
        for (const row of (data as BookRow[] | null ?? [])) {
            map.set(row.id, rowToBook(row));
        }
    }
    return map;
}
