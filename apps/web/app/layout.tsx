import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/src/context/AuthContext';
import { NavBar } from '@/src/components/NavBar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'eLibrary',
    description: 'Borrow, read, and manage library resources online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <NavBar />
                    <main className="main-content">{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
