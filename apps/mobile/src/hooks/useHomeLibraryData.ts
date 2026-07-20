import { useCallback, useEffect, useState } from 'react';

import { getHomeLibrary, getMemberType } from '@/src/services/firestore/libraryBranchService';
import {
    borrowBook,
    getActiveBorrowRecordForUser,
    getBookById,
    getDueSoon,
    getFeaturedEbook,
} from '@/src/services/firestore/libraryService';
import {
    getRecentNotifications,
    getUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/src/services/firestore/notificationFeedService';
import type {
    AppNotification,
    Book,
    DueSoonEntry,
    Library,
    MemberType,
} from '@/src/types/library';

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
    // Dashboard extensions (each loads independently for resilience).
    memberType: MemberType;
    homeLibrary: Library | null;
    homeLibraryLoading: boolean;
    dueSoon: DueSoonEntry[];
    dueSoonLoading: boolean;
    notifications: AppNotification[];
    notificationsLoading: boolean;
    unreadCount: number;
    markOneRead: (id: string) => void;
    markAllRead: () => void;
};

export function useHomeLibraryData(userId: string): HomeLibraryData {
    const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
    const [continueReading, setContinueReading] = useState<ContinueReadingItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [memberType, setMemberType] = useState<MemberType>('Community');
    const [homeLibrary, setHomeLibrary] = useState<Library | null>(null);
    const [homeLibraryLoading, setHomeLibraryLoading] = useState(true);
    const [dueSoon, setDueSoon] = useState<DueSoonEntry[]>([]);
    const [dueSoonLoading, setDueSoonLoading] = useState(true);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

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
                setContinueReading(
                    borrowedBook
                        ? {
                              bookId: borrowedBook.id,
                              title: borrowedBook.title,
                              progressLabel: 'Due in 7 days',
                              progress: 0.2,
                              coverImage: borrowedBook.coverImage,
                          }
                        : null,
                );
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

    // Dashboard panels load independently so one failure never blanks the home.
    const loadDashboardExtras = useCallback(() => {
        getMemberType(userId)
            .then((type) => { if (type) setMemberType(type); })
            .catch(() => { });

        setHomeLibraryLoading(true);
        getHomeLibrary(userId)
            .then((lib) => setHomeLibrary(lib))
            .catch(() => setHomeLibrary(null))
            .finally(() => setHomeLibraryLoading(false));

        setDueSoonLoading(true);
        getDueSoon(userId)
            .then((items) => setDueSoon(items))
            .catch(() => setDueSoon([]))
            .finally(() => setDueSoonLoading(false));

        setNotificationsLoading(true);
        getRecentNotifications(userId, 5)
            .then((items) => setNotifications(items))
            .catch(() => setNotifications([]))
            .finally(() => setNotificationsLoading(false));

        getUnreadCount(userId)
            .then(setUnreadCount)
            .catch(() => setUnreadCount(0));
    }, [userId]);

    const borrowFeaturedBook = useCallback(async () => {
        if (!featuredBook) {
            throw new Error('No featured eBook is available right now.');
        }
        await borrowBook(userId, featuredBook);
        await load();
    }, [featuredBook, load, userId]);

    const markOneRead = useCallback((id: string) => {
        // Optimistic: flip locally + decrement, then persist.
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        void markNotificationRead(id).catch(() => { });
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        void markAllNotificationsRead(userId).catch(() => { });
    }, [userId]);

    useEffect(() => {
        void load();
        loadDashboardExtras();
    }, [load, loadDashboardExtras]);

    return {
        featuredBook,
        continueReading,
        loading,
        error,
        refresh: load,
        borrowFeaturedBook,
        memberType,
        homeLibrary,
        homeLibraryLoading,
        dueSoon,
        dueSoonLoading,
        notifications,
        notificationsLoading,
        unreadCount,
        markOneRead,
        markAllRead,
    };
}
