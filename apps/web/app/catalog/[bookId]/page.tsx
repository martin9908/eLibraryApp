'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import {
    borrowBook,
    getActiveBorrowRecordForBook,
    getBookById,
    returnBook,
} from '@/src/services/libraryService';
import type { Book, BorrowRecord } from '@elibrary/types';

export default function BookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = typeof params.bookId === 'string' ? params.bookId : '';
    const { user } = useAuth();

    const [book, setBook] = useState<Book | null>(null);
    const [record, setRecord] = useState<BorrowRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [b, r] = await Promise.all([
                getBookById(bookId),
                user ? getActiveBorrowRecordForBook(user.uid, bookId) : Promise.resolve(null),
            ]);
            setBook(b);
            setRecord(r);
        } finally {
            setLoading(false);
        }
    }, [bookId, user]);

    useEffect(() => { void load(); }, [load]);

    const handleBorrow = async () => {
        if (!book || !user) { router.push('/login'); return; }
        setActionLoading(true);
        setError(null);
        try {
            await borrowBook(user.uid, book);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Borrow failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturn = async () => {
        if (!record || !book) return;
        if (!confirm(`Return "${book.title}"?`)) return;
        setActionLoading(true);
        try {
            await returnBook(record.id, book.id);
            await load();
        } catch {
            setError('Could not return the book. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner" /></div>;
    if (!book) return <div className="empty-state">Book not found.</div>;

    const isBorrowed = record !== null;
    const canBorrow = !isBorrowed && book.availableCopies > 0;
    const initials = book.title.slice(0, 2).toUpperCase();

    return (
        <>
            <div className="detail-layout">
                {/* Cover */}
                <div className="detail-cover">
                    {book.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.coverImage} alt={book.title} />
                    ) : (
                        <div className="detail-cover-fallback">{initials}</div>
                    )}
                </div>

                {/* Info */}
                <div className="detail-info">
                    <h1 className="detail-title">{book.title}</h1>
                    <p className="detail-author">{book.author}</p>

                    <div className="detail-meta">
                        <span className={`badge badge-${book.type}`}>
                            {book.type === 'ebook' ? 'eBook' : 'Physical'}
                        </span>
                        <span className="badge" style={{ background: '#f5f5f5', color: '#555' }}>
                            {book.category}
                        </span>
                    </div>

                    <div className="detail-availability">
                        Copies available:{' '}
                        <span className={book.availableCopies > 0 ? 'availability-ok' : 'availability-none'}>
                            {book.availableCopies} / {book.totalCopies}
                        </span>
                    </div>

                    {isBorrowed && (
                        <p style={{ marginTop: 8, fontSize: '0.88rem', color: '#1565c0', fontWeight: 600 }}>
                            ✓ You currently have this book borrowed
                            {record?.dueDate
                                ? ` · Due ${new Date(record.dueDate.seconds * 1000).toLocaleDateString()}`
                                : ''}
                        </p>
                    )}

                    {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

                    <div className="detail-actions">
                        {isBorrowed && book.type === 'ebook' && book.ebookUrl && (
                            <a
                                href={book.ebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary">
                                📖 Read Online
                            </a>
                        )}
                        {isBorrowed && (
                            <button
                                className="btn btn-danger"
                                onClick={handleReturn}
                                disabled={actionLoading}>
                                {actionLoading ? 'Returning…' : 'Return Book'}
                            </button>
                        )}
                        {canBorrow && (
                            <button
                                className="btn btn-primary"
                                onClick={handleBorrow}
                                disabled={actionLoading}>
                                {actionLoading ? 'Borrowing…' : 'Borrow'}
                            </button>
                        )}
                        {!isBorrowed && book.availableCopies === 0 && (
                            <button className="btn btn-outline" disabled>
                                Currently Unavailable
                            </button>
                        )}
                        {!user && canBorrow && (
                            <p style={{ fontSize: '0.82rem', color: '#666', alignSelf: 'center' }}>
                                <a href="/login" style={{ color: '#2196F3' }}>Sign in</a> to borrow this book.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
