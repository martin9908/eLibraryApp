import { buildThemeCss } from '@elibrary/theme';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['500', '600', '700', '800'],
    variable: '--font-display',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'eLibrary — Read anything, anywhere',
    description: 'Browse the collection, borrow books, and read eBooks instantly. Your library, online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
            <head>
                {/* Brand color tokens from the shared @elibrary/theme package.
                    Static string → identical on server & client (no hydration mismatch). */}
                <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: buildThemeCss() }} />
            </head>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
