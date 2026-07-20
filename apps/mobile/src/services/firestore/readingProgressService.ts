import {
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import { getBooksByIds } from '@/src/services/firestore/libraryService';
import type { ReadingProgress, ReadingProgressEntry } from '@/src/types/library';

const READING_PROGRESS_COLLECTION = 'readingProgress';

/**
 * Persist a member's reading position (owner-only per security rules). Keyed by
 * `${userId}_${bookId}` so re-reads update in place — mirrors the web app so
 * Continue Reading reflects real progress on both platforms.
 */
export async function saveReadingProgress(
    userId: string,
    bookId: string,
    currentPage: number,
    totalPages: number,
): Promise<void> {
    if (!userId || !bookId || totalPages <= 0) return;
    await setDoc(
        doc(db, READING_PROGRESS_COLLECTION, `${userId}_${bookId}`),
        { userId, bookId, currentPage, totalPages, updatedAt: serverTimestamp() },
        { merge: true },
    );
}

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
