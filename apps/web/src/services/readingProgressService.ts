import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import { getBooksByIds } from '@/src/services/libraryService';
import type { ReadingProgress, ReadingProgressEntry } from '@elibrary/types';

const READING_PROGRESS = 'readingProgress';

function mapProgress(id: string, raw: Record<string, unknown>): ReadingProgress {
    return {
        id,
        userId: (raw.userId as string) ?? '',
        bookId: (raw.bookId as string) ?? '',
        currentPage: (raw.currentPage as number) ?? 1,
        totalPages: (raw.totalPages as number) ?? 0,
        updatedAt: raw.updatedAt as ReadingProgress['updatedAt'],
    };
}

/**
 * Most-recently-read in-progress titles for the Continue Reading panel, joined
 * with book metadata. Rows whose book cannot be resolved are dropped so the
 * panel never renders a broken item. Scoped to the passed userId (FR-020).
 */
export async function getContinueReading(userId: string, max = 4): Promise<ReadingProgressEntry[]> {
    const q = query(
        collection(db, READING_PROGRESS),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(max),
    );
    const snap = await getDocs(q);
    const progresses = snap.docs.map((d) => mapProgress(d.id, d.data() as Record<string, unknown>));
    if (progresses.length === 0) return [];

    const bookMap = await getBooksByIds(Array.from(new Set(progresses.map((p) => p.bookId))));
    return progresses
        .map((progress) => ({ progress, book: bookMap.get(progress.bookId) ?? null }))
        .filter((entry) => entry.book !== null);
}
