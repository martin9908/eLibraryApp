'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { getAllBooks } from '@/src/services/libraryService';
import type { Book } from '@elibrary/types';

export default function HomePage() {
    const { user, initialising } = useAuth();
    const [featured, setFeatured] = useState<Book[]>([]);

    useEffect(() => {
        getAllBooks({ type: 'ebook' })
            .then((books) => setFeatured(books.slice(0, 4)))
            .catch(() => {});
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
                <h1 className="hero-title">
                    {user ? `Welcome back, ${user.displayName ?? 'Patron'}!` : 'Your Community Library, Online.'}
                </h1>
                <p className="hero-subtitle">
                    {user
                        ? 'Browse the catalog, borrow books, and track your reading.'
                        : 'Browse thousands of titles. Sign in to borrow physical books and read eBooks instantly.'}
                </p>
                <div className="hero-actions">
                    <Link href="/catalog" className="btn btn-white">Browse Catalog</Link>
                    {!user && (
                        <Link href="/register" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
                            Get Started
                        </Link>
                    )}
                </div>
            </section>

            {/* Featured eBooks */}
            {featured.length > 0 && (
                <section>
                    <h2 className="section-title">Featured eBooks</h2>
                    <div className="book-grid">
                        {featured.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}

function BookCard({ book }: { book: Book }) {
    const initials = book.title.slice(0, 2).toUpperCase();
    return (
        <Link href={`/catalog/${book.id}`} className="book-card card">
            <div className="book-cover">
                {book.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverImage} alt={book.title} />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
                <span className={`badge badge-${book.type}`}>
                    {book.type === 'ebook' ? 'eBook' : 'Physical'}
                </span>
            </div>
        </Link>
    );
}
