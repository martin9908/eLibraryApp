'use client';

import { useAuth } from '@/src/context/AuthContext';
import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import {
    getDueSoon,
    getFeaturedBooks,
} from '@/src/services/libraryService';
import { getHomeLibrary } from '@/src/services/libraryBranchService';
import {
    getRecentNotifications,
    getUnreadCount,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/src/services/notificationService';
import { getContinueReading } from '@/src/services/readingProgressService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import type {
    Book,
    DueSoonEntry,
    Library,
    Notification,
    ReadingProgressEntry,
    UserProfile,
} from '@elibrary/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { BrowseActions } from '@/src/components/dashboard/BrowseActions';
import { ContinueReading } from '@/src/components/dashboard/ContinueReading';
import { DueSoonPanel } from '@/src/components/dashboard/DueSoonPanel';
import { FeaturedRow } from '@/src/components/dashboard/FeaturedRow';
import { LibraryHours } from '@/src/components/dashboard/LibraryHours';
import { NotificationsPanel } from '@/src/components/dashboard/NotificationsPanel';
import { QuickLinks } from '@/src/components/dashboard/QuickLinks';
import { WelcomeBanner } from '@/src/components/dashboard/WelcomeBanner';

/** Small per-panel loading wrapper so one failing panel never blanks the page. */
type PanelState<T> = { data: T; loading: boolean };

export default function DashboardPage() {
    const { user, initialising } = useAuth();
    const router = useRouter();

    const [memberType, setMemberType] = useState<string>(S.welcome.memberFallback);
    const [library, setLibrary] = useState<PanelState<Library | null>>({ data: null, loading: true });
    const [featured, setFeatured] = useState<PanelState<Book[]>>({ data: [], loading: true });
    const [continueReading, setContinueReading] = useState<PanelState<ReadingProgressEntry[]>>({ data: [], loading: true });
    const [dueSoon, setDueSoon] = useState<PanelState<DueSoonEntry[]>>({ data: [], loading: true });
    const [notifications, setNotifications] = useState<PanelState<Notification[]>>({ data: [], loading: true });
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!initialising && !user) router.push('/login');
    }, [user, initialising, router]);

    // Each panel loads independently; a rejection settles only that panel (FR-018).
    useEffect(() => {
        if (!user) return;
        const uid = user.uid;

        getDoc(doc(db, 'users', uid))
            .then((snap) => {
                const profile = snap.exists() ? (snap.data() as UserProfile) : undefined;
                if (profile?.memberType) setMemberType(profile.memberType);
            })
            .catch(() => { });

        getHomeLibrary(uid)
            .then((lib) => setLibrary({ data: lib, loading: false }))
            .catch(() => setLibrary({ data: null, loading: false }));

        getFeaturedBooks(4)
            .then((books) => setFeatured({ data: books, loading: false }))
            .catch(() => setFeatured({ data: [], loading: false }));

        getContinueReading(uid, 4)
            .then((items) => setContinueReading({ data: items, loading: false }))
            .catch(() => setContinueReading({ data: [], loading: false }));

        getDueSoon(uid)
            .then((items) => setDueSoon({ data: items, loading: false }))
            .catch(() => setDueSoon({ data: [], loading: false }));

        getRecentNotifications(uid, 5)
            .then((items) => setNotifications({ data: items, loading: false }))
            .catch(() => setNotifications({ data: [], loading: false }));

        getUnreadCount(uid)
            .then(setUnread)
            .catch(() => setUnread(0));
    }, [user]);

    const handleMarkOne = useCallback(async (id: string) => {
        // Optimistic: flip locally and decrement count, then persist (FR-011).
        setNotifications((prev) => ({
            ...prev,
            data: prev.data.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
        setUnread((c) => Math.max(0, c - 1));
        try {
            await markNotificationRead(id);
        } catch { /* best-effort; refetch on next load */ }
    }, []);

    const handleMarkAll = useCallback(async () => {
        if (!user) return;
        setNotifications((prev) => ({ ...prev, data: prev.data.map((n) => ({ ...n, read: true })) }));
        setUnread(0);
        try {
            await markAllNotificationsRead(user.uid);
        } catch { /* best-effort */ }
    }, [user]);

    if (initialising || !user) {
        return <div className="loading-container"><div className="spinner" /></div>;
    }

    const displayName = user.displayName ?? 'Reader';

    return (
        <div className="dash-grid">
            <main className="dash-main">
                {/* US1 */}
                <WelcomeBanner displayName={displayName} memberType={memberType} />
                <BrowseActions />

                {/* US3 */}
                <FeaturedRow books={featured.data} loading={featured.loading} />
                <ContinueReading items={continueReading.data} loading={continueReading.loading} />
            </main>

            <aside className="dash-rail">
                {/* US2 */}
                <NotificationsPanel
                    items={notifications.data}
                    unread={unread}
                    loading={notifications.loading}
                    onMarkAll={handleMarkAll}
                    onMarkOne={handleMarkOne}
                />
                <DueSoonPanel items={dueSoon.data} loading={dueSoon.loading} />

                {/* US1 */}
                <LibraryHours library={library.data} loading={library.loading} />
                <QuickLinks />
            </aside>
        </div>
    );
}
