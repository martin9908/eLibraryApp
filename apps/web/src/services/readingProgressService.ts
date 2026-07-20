import { supabase } from '@/src/lib/supabase';
import { rowToReadingProgress } from '@/src/lib/supabaseMap';
import type { ReadingProgressRow } from '@/src/lib/supabaseMap';
import { getBooksByIds } from '@/src/services/libraryService';
import type { ReadingProgressEntry } from '@elibrary/types';

const READING_PROGRESS = 'reading_progress';

/**
 * Persist a member's reading position (owner-only per RLS). Keyed by
 * `${userId}_${bookId}` so re-reads update in place (upsert on the
 * (user_id, book_id) unique constraint). Called by the reader as the page
 * changes — this is what makes Continue Reading reflect reality.
 */
export async function saveReadingProgress(
    userId: string,
    bookId: string,
    currentPage: number,
    totalPages: number,
): Promise<void> {
    if (!userId || !bookId || totalPages <= 0) return;
    const { error } = await supabase.from(READING_PROGRESS).upsert(
        {
            id: `${userId}_${bookId}`,
            user_id: userId,
            book_id: bookId,
            current_page: currentPage,
            total_pages: totalPages,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,book_id' },
    );
    if (error) throw error;
}

/**
 * Most-recently-read in-progress titles for the Continue Reading panel, joined
 * with book metadata. Rows whose book cannot be resolved are dropped so the
 * panel never renders a broken item. Scoped to the passed userId (FR-020).
 */
export async function getContinueReading(userId: string, max = 4): Promise<ReadingProgressEntry[]> {
    const { data, error } = await supabase
        .from(READING_PROGRESS)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(max);
    if (error) throw error;
    const progresses = (data as ReadingProgressRow[]).map(rowToReadingProgress);
    if (progresses.length === 0) return [];

    const bookMap = await getBooksByIds(Array.from(new Set(progresses.map((p) => p.bookId))));
    return progresses
        .map((progress) => ({ progress, book: bookMap.get(progress.bookId) ?? null }))
        .filter((entry) => entry.book !== null);
}
