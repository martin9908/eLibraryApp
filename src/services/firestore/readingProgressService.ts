import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import { getBooksByIds } from '@/src/services/firestore/libraryService';
import type { ReadingProgress, ReadingProgressEntry } from '@/src/types/library';

const READING_PROGRESS_COLLECTION = 'readingProgress';

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
 * Most-recently-read in-progress titles for the Continue Reading section,
 * joined with book metadata. Rows whose book cannot be resolved are dropped so
 * the section never renders a broken item. Scoped to the passed userId.
 */
export async function getContinueReading(userId: string, max = 4): Promise<ReadingProgressEntry[]> {
    const q = query(
        collection(db, READING_PROGRESS_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(max),
    );
    const snapshot = await getDocs(q);
    const progresses = snapshot.docs.map((d) => mapProgress(d.id, d.data() as Record<string, unknown>));
    if (progresses.length === 0) return [];

    const bookMap = await getBooksByIds(Array.from(new Set(progresses.map((p) => p.bookId))));
    return progresses
        .map((progress) => ({ progress, book: bookMap.get(progress.bookId) ?? null }))
        .filter((entry) => entry.book !== null);
}
