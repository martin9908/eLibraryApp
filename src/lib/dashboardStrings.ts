/**
 * Centralized copy for the mobile home dashboard sections.
 *
 * Mirrors the web app's `apps/web/src/lib/dashboardStrings.ts`. Externalizing
 * these strings (rather than inlining literals in each organism) keeps the UI
 * ready for a future locale layer without reworking markup — Constitution
 * Principle II (Inclusivity: "support presentation in more than one language
 * where reasonably achievable").
 */
export const dashboardStrings = {
    quickActions: {
        ebooksTitle: 'eBooks',
        ebooksSubtitle: 'Read instantly',
        physicalTitle: 'Physical Books',
        physicalSubtitle: 'Reserve & pick up',
    },
    dueSoon: {
        title: 'Due Soon',
        viewAll: 'View all',
        empty: 'Nothing due soon. Enjoy your reading!',
        loading: 'Loading…',
        dueOn: (date: string) => `Due: ${date}`,
    },
    notifications: {
        title: 'Notifications',
        markAll: 'Mark all as read',
        empty: 'You are all caught up.',
        loading: 'Loading…',
    },
    libraryHours: {
        title: 'Library Hours',
        loading: 'Loading…',
        openNow: 'Open Now',
        closed: 'Closed',
        hoursUnavailable: 'Hours unavailable',
        chooseTitle: 'Choose your library',
        chooseBody: 'Set your home library to see local hours and physical-book availability.',
        chooseCta: 'Choose a library',
    },
    quickLinks: {
        title: 'Quick Links',
        reserve: 'Reserve Book',
        rules: 'Library Rules',
        guide: 'User Guide',
        contact: 'Contact Us',
    },
} as const;
