import { supabase } from '@/src/lib/supabase';
import { rowToReadingProgress } from '@/src/lib/supabaseMap';
import type { ReadingProgressRow } from '@/src/lib/supabaseMap';
import { getBooksByIds } from '@/src/services/firestore/libraryService';
import type { ReadingProgressEntry } from '@/src/types/library';

const READING_PROGRESS_TABLE = 'reading_progress';

/**
 * Persist a member's reading position (owner-only per RLS). The row id is kept
 * deterministic as `${userId}_${bookId}` (mirrors the web app) and upserted on
 * the (user_id, book_id) unique constraint so re-reads update in place —
 * Continue Reading reflects real progress on both platforms.
 */
export async function saveReadingProgress(
    userId: string,
    bookId: string,
    currentPage: number,
    totalPages: number,
): Promise<void> {
    if (!userId || !bookId || totalPages <= 0) return;
    const { error } = await supabase.from(READING_PROGRESS_TABLE).upsert(
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
 * Most-recently-read in-progress titles for the Continue Reading section,
 * joined with book metadata. Rows whose book cannot be resolved are dropped so
 * the section never renders a broken item. Scoped to the passed userId.
 */
export async function getContinueReading(userId: string, max = 4): Promise<ReadingProgressEntry[]> {
    const { data, error } = await supabase
        .from(READING_PROGRESS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(max);
    if (error) throw error;

    const progresses = (data as ReadingProgressRow[] | null ?? []).map((row) =>
        rowToReadingProgress(row),
    );
    if (progresses.length === 0) return [];

    const bookMap = await getBooksByIds(Array.from(new Set(progresses.map((p) => p.bookId))));
    return progresses
        .map((progress) => ({ progress, book: bookMap.get(progress.bookId) ?? null }))
        .filter((entry) => entry.book !== null);
}
