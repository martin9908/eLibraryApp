'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllBooks } from '@/src/services/libraryService';
import type { Book, BookType } from '@elibrary/types';

type Filter = 'all' | BookType;

const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'eBooks', value: 'ebook' },
    { label: 'Physical', value: 'physical' },
];

export default function CatalogPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');

    const fetchBooks = useCallback(async (type: Filter) => {
        setLoading(true);
        setError(null);
        try {
            const results = await getAllBooks({ type: type === 'all' ? undefined : type });
            setBooks(results);
        } catch {
            setError('Unable to load books. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchBooks(filter);
    }, [filter, fetchBooks]);

    const filtered = useMemo(() => {
        if (!search.trim()) return books;
        const q = search.toLowerCase();
        return books.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                b.author.toLowerCase().includes(q) ||
                b.category.toLowerCase().includes(q),
        );
    }, [books, search]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Catalog</h1>
                <p className="page-subtitle">Browse and borrow from our collection.</p>
            </div>

            <input
                className="search-bar"
                placeholder="Search titles, authors, categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="filters-row">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        className={`filter-chip${filter === f.value ? ' active' : ''}`}
                        onClick={() => setFilter(f.value)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : error ? (
                <div className="alert alert-error">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">No books found.</div>
            ) : (
                <div className="book-grid">
                    {filtered.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
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
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                    <span className={`badge badge-${book.type}`}>
                        {book.type === 'ebook' ? 'eBook' : 'Physical'}
                    </span>
                    <span
                        style={{ fontSize: '0.78rem', color: book.availableCopies > 0 ? '#2e7d32' : '#c62828' }}>
                        {book.availableCopies > 0 ? `${book.availableCopies} avail.` : 'Unavailable'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
