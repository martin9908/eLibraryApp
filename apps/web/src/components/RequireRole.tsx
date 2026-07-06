'use client';

import { useAuth } from '@/src/context/AuthContext';
import { canAccessManageArea } from '@/src/lib/access';
import type { Role } from '@elibrary/types';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/**
 * Route/section guard: renders children only for users whose role is allowed.
 * Redirects patrons (or unauthenticated users) away from management areas.
 *
 * UX convenience only — the real boundary is Firestore rules + Cloud Functions.
 */
export function RequireRole({
    allow,
    children,
    redirectTo = '/dashboard',
}: {
    /** Roles permitted. Defaults to the management-area set (librarian + admin). */
    allow?: Role[];
    children: ReactNode;
    redirectTo?: string;
}) {
    const { user, role, initialising } = useAuth();
    const router = useRouter();

    const permitted = allow ? allow.includes(role) : canAccessManageArea(role);

    useEffect(() => {
        if (initialising) return;
        if (!user) {
            router.replace('/login');
        } else if (!permitted) {
            router.replace(redirectTo);
        }
    }, [user, permitted, initialising, router, redirectTo]);

    if (initialising || !user || !permitted) {
        return <div className="loading-container"><div className="spinner" /></div>;
    }
    return <>{children}</>;
}
