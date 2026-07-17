'use client';

import { BookCard, BookGridSkeleton } from '@/src/components/BookCard';
import { getAllBooks } from '@/src/services/libraryService';
import type { Book, BookType } from '@elibrary/types';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

type Filter = 'all' | BookType;

const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: '📱 eBooks', value: 'ebook' },
    { label: '📗 Physical', value: 'physical' },
];

function CatalogInner() {
    const searchParams = useSearchParams();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState(searchParams.get('q') ?? '');
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
                <h1 className="page-title">Browse the Collection</h1>
                <p className="page-subtitle">Discover, borrow, and read from thousands of titles.</p>
            </div>

            <div className="catalog-toolbar">
                <div className="search-bar-wrap">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className="search-bar"
                        placeholder="Search titles, authors, categories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
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
            </div>

            {!loading && !error && (
                <p className="result-count">
                    {filtered.length} {filtered.length === 1 ? 'title' : 'titles'}
                    {search.trim() ? ` matching “${search.trim()}”` : ''}
                </p>
            )}

            {loading ? (
                <BookGridSkeleton count={10} />
            ) : error ? (
                <div className="alert alert-error">⚠️ {error}</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-emoji">🔍</span>
                    <div className="empty-title">No titles found</div>
                    <p>Try a different search term or filter.</p>
                </div>
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

export default function CatalogPage() {
    return (
        <Suspense fallback={<BookGridSkeleton count={10} />}>
            <CatalogInner />
        </Suspense>
    );
}
