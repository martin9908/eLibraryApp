'use client';

import { AuthProvider } from '@/src/context/AuthContext';
import { NavBar } from '@/src/components/NavBar';
import { SiteFooter } from '@/src/components/SiteFooter';
import type { ReactNode } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <NavBar />
            <main className="main-content">{children}</main>
            <SiteFooter />
        </AuthProvider>
    );
}
