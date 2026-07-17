'use client';

import { BookCard, BookGridSkeleton } from '@/src/components/BookCard';
import { useAuth } from '@/src/context/AuthContext';
import { getAllBooks } from '@/src/services/libraryService';
import type { Book } from '@elibrary/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CATEGORIES = [
    { label: 'Fiction', emoji: '📖' },
    { label: 'History', emoji: '🏛️' },
    { label: 'Science', emoji: '🔬' },
    { label: 'Children', emoji: '🧸' },
    { label: 'Reference', emoji: '📚' },
    { label: 'Biography', emoji: '👤' },
];

export default function HomePage() {
    const { user, initialising } = useAuth();
    const [featured, setFeatured] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllBooks({ type: 'ebook' })
            .then((books) => setFeatured(books.slice(0, 5)))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (initialising) {
        return (
            <div className="loading-container">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <>
            {/* Hero */}
            <section className="hero-section">
                <span className="hero-eyebrow">✨ Read anything, anywhere</span>
                <h1 className="hero-title">
                    {user ? (
                        <>Welcome back,<br /><span className="accent">{user.displayName ?? 'Reader'}</span>.</>
                    ) : (
                        <>Your community library, <span className="accent">reimagined online.</span></>
                    )}
                </h1>
                <p className="hero-subtitle">
                    {user
                        ? 'Pick up where you left off — browse the collection, borrow titles, and track your reading in one place.'
                        : 'Thousands of titles at your fingertips. Sign in to borrow physical books and read eBooks instantly, free of charge.'}
                </p>
                <div className="hero-actions">
                    <Link href="/catalog" className="btn btn-white">Browse Collection →</Link>
                    {!user && (
                        <Link href="/register" className="btn btn-ghost-light">Get Started</Link>
                    )}
                </div>
            </section>

            {/* Categories */}
            <div className="section-head">
                <h2 className="section-title">Explore by category</h2>
            </div>
            <div className="category-strip">
                {CATEGORIES.map((c) => (
                    <Link key={c.label} href={`/catalog?q=${encodeURIComponent(c.label)}`} className="category-pill">
                        <span>{c.emoji}</span> {c.label}
                    </Link>
                ))}
            </div>

            {/* Featured eBooks */}
            <div className="section-head">
                <h2 className="section-title">Featured eBooks</h2>
                <Link href="/catalog" className="section-link">View all →</Link>
            </div>
            {loading ? (
                <BookGridSkeleton count={5} />
            ) : featured.length > 0 ? (
                <div className="book-grid">
                    {featured.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <span className="empty-emoji">📚</span>
                    <div className="empty-title">No featured titles yet</div>
                    <p>Check back soon — the collection is growing.</p>
                </div>
            )}
        </>
    );
}
