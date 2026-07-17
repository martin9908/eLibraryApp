'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// dynamic with ssr:false must live in a Client Component.
// This prevents Firebase Auth (which accesses localStorage) from
// running in Node.js where localStorage is unavailable or broken.
const ClientProviders = dynamic(
    () => import('@/src/components/ClientProviders').then((m) => m.ClientProviders),
    { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
    return <ClientProviders>{children}</ClientProviders>;
}
