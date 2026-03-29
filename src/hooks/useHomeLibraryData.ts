import { useCallback, useEffect, useState } from 'react';

import {
    borrowBook,
    getActiveBorrowRecordForUser,
    getBookById,
    getFeaturedEbook,
} from '@/src/services/firestore/libraryService';
import type { Book } from '@/src/types/library';

type ContinueReadingItem = {
    bookId: string;
    title: string;
    progressLabel: string;
    progress: number;
    coverImage?: string;
};

type HomeLibraryData = {
    featuredBook: Book | null;
    continueReading: ContinueReadingItem | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    borrowFeaturedBook: () => Promise<void>;
};

export function useHomeLibraryData(userId: string): HomeLibraryData {
    const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
    const [continueReading, setContinueReading] = useState<ContinueReadingItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [featured, activeBorrowRecord] = await Promise.all([
                getFeaturedEbook(),
                getActiveBorrowRecordForUser(userId),
            ]);

            setFeaturedBook(featured);

            if (activeBorrowRecord) {
                const borrowedBook = await getBookById(activeBorrowRecord.bookId);

                if (borrowedBook) {
                    setContinueReading({
                        bookId: borrowedBook.id,
                        title: borrowedBook.title,
                        progressLabel: 'Due in 7 days',
                        progress: 0.2,
                        coverImage: borrowedBook.coverImage,
                    });
                } else {
                    setContinueReading(null);
                }
            } else {
                setContinueReading(null);
            }
        } catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : 'Failed to load library data.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const borrowFeaturedBook = useCallback(async () => {
        if (!featuredBook) {
            throw new Error('No featured eBook is available right now.');
        }

        await borrowBook(userId, featuredBook);
        await load();
    }, [featuredBook, load, userId]);

    useEffect(() => {
        void load();
    }, [load]);

    return {
        featuredBook,
        continueReading,
        loading,
        error,
        refresh: load,
        borrowFeaturedBook,
    };
}
