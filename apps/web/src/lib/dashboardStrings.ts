/**
 * Centralized copy for the member dashboard.
 *
 * All user-facing dashboard text lives here (no inline literals in components)
 * so a locale layer can be introduced later without touching markup — see
 * spec FR-019 and research R8. Keep values plain-language and non-technical
 * (Constitution Principle II).
 */
export const dashboardStrings = {
    welcome: {
        greeting: (name: string) => `Welcome, ${name}!`,
        subtitle: 'Access your books anytime, anywhere.',
        memberFallback: 'Member',
    },
    browse: {
        ebooksTitle: 'Browse eBooks',
        ebooksSubtitle: 'Read instantly, free of charge',
        physicalTitle: 'Browse Physical Books',
        physicalSubtitle: 'Reserve and borrow from your library',
    },
    featured: {
        title: 'Featured eBooks',
        viewAll: 'View all',
        empty: 'No featured titles yet — check back soon.',
        unavailable: 'Unavailable',
        borrow: 'Borrow Now',
    },
    continueReading: {
        title: 'Continue Reading',
        viewAll: 'View all',
        empty: 'Nothing in progress yet. Open a book to start reading.',
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
        resume: 'Resume',
    },
    notifications: {
        title: 'Notifications',
        markAll: 'Mark All as Read',
        empty: 'You are all caught up.',
        unreadLabel: (n: number) => `${n} unread notification${n === 1 ? '' : 's'}`,
    },
    dueSoon: {
        title: 'Due Soon',
        viewAll: 'View all',
        empty: 'Nothing due soon. Enjoy your reading!',
        overdue: 'Overdue',
        dueTomorrow: 'Due tomorrow',
        dueToday: 'Due today',
        daysLeft: (n: number) => `${n} days left`,
        dueOn: (date: string) => `Due: ${date}`,
    },
    libraryHours: {
        title: 'Library Hours',
        openNow: 'Open Now',
        closed: 'Closed',
        hoursUnavailable: 'Hours unavailable',
        chooseLibraryTitle: 'Choose your library',
        chooseLibraryBody: 'Set your home library to see local hours and physical-book availability.',
        chooseLibraryCta: 'Choose a library',
        contactSupport: 'Contact Support',
    },
    quickLinks: {
        title: 'Quick Links',
        reserve: 'Reserve Book',
        rules: 'Library Rules',
        guide: 'User Guide',
        contact: 'Contact Us',
    },
    common: {
        retry: 'Something went wrong. Try again.',
    },
} as const;
