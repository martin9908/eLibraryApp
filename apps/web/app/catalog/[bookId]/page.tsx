'use client';

import { useAuth } from '@/src/context/AuthContext';
import {
    borrowBook,
    getActiveBorrowRecordForBook,
    getBookById,
    returnBook,
} from '@/src/services/libraryService';
import { saveReadingProgress } from '@/src/services/readingProgressService';
import type { Book, BorrowRecord } from '@elibrary/types';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// pdf.js touches the DOM/Worker — load the reader client-side only.
const PdfReader = dynamic(
    () => import('@/src/components/PdfReader').then((m) => m.PdfReader),
    { ssr: false },
);

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
    const [readerOpen, setReaderOpen] = useState(false);

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
        const verb = book.type === 'physical' ? 'Cancel the reservation for' : 'Return';
        if (!confirm(`${verb} "${book.title}"?`)) return;
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
    if (!book) {
        return (
            <div className="empty-state">
                <span className="empty-emoji">📕</span>
                <div className="empty-title">Book not found</div>
                <p>This title may have been removed. <Link href="/catalog" style={{ color: 'var(--indigo-600)', fontWeight: 700 }}>Back to catalog</Link></p>
            </div>
        );
    }

    const isBorrowed = record !== null;
    const canBorrow = !isBorrowed && book.availableCopies > 0;
    const initials = book.title.slice(0, 2).toUpperCase();
    // Physical titles are reserved for in-branch pickup; eBooks are borrowed to read in-app.
    // (Hybrid Community Library System — Constitution Principle V: preserve physical libraries.)
    const isPhysical = book.type === 'physical';

    return (
        <>
            <Link href="/catalog" className="back-link">← Back to catalog</Link>

            <div className="detail-layout">
                {/* Cover */}
                <div className="detail-cover">
                    {book.coverImage ? (
                        <div className="cover-frame">
                            <Image
                                src={book.coverImage}
                                alt={book.title}
                                fill
                                sizes="(max-width: 900px) 100vw, 320px"
                            />
                        </div>
                    ) : (
                        <div className="detail-cover-fallback">{initials}</div>
                    )}
                </div>

                {/* Info */}
                <div className="detail-info">
                    <h1 className="detail-title">{book.title}</h1>
                    <p className="detail-author">by {book.author}</p>

                    <div className="detail-meta">
                        <span className={`badge badge-${book.type}`}>
                            {book.type === 'ebook' ? '📱 eBook' : '📗 Physical'}
                        </span>
                        <span className="badge badge-neutral">{book.category}</span>
                    </div>

                    <div className="availability-panel">
                        <span className={`availability-figure ${book.availableCopies > 0 ? 'ok' : 'none'}`}>
                            {book.availableCopies}
                        </span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                {book.availableCopies > 0 ? 'Available now' : 'Currently unavailable'}
                            </div>
                            <div className="availability-label">
                                {book.availableCopies} of {book.totalCopies} copies
                            </div>
                        </div>
                    </div>

                    {isBorrowed && (
                        <div className="borrowed-note">
                            {isPhysical ? '✓ Reserved for pickup at your library' : '✓ You have this book'}
                            {record?.dueDate
                                ? ` · ${isPhysical ? 'Hold until' : 'Due'} ${new Date(record.dueDate.seconds * 1000).toLocaleDateString()}`
                                : ''}
                        </div>
                    )}

                    {error && <div className="alert alert-error" style={{ marginTop: 14 }}>⚠️ {error}</div>}

                    <div className="detail-actions">
                        {isBorrowed && book.type === 'ebook' && book.ebookUrl && (
                            <button className="btn btn-secondary" onClick={() => setReaderOpen(true)}>
                                📖 Read Online
                            </button>
                        )}
                        {isBorrowed && (
                            <button
                                className="btn btn-danger"
                                onClick={handleReturn}
                                disabled={actionLoading}>
                                {actionLoading
                                    ? (isPhysical ? 'Cancelling…' : 'Returning…')
                                    : (isPhysical ? 'Cancel Reservation' : 'Return Book')}
                            </button>
                        )}
                        {canBorrow && (
                            <button
                                className="btn btn-primary"
                                onClick={handleBorrow}
                                disabled={actionLoading}>
                                {actionLoading
                                    ? (isPhysical ? 'Reserving…' : 'Borrowing…')
                                    : user
                                        ? (isPhysical ? 'Reserve for pickup' : 'Borrow this book')
                                        : (isPhysical ? 'Sign in to reserve' : 'Sign in to borrow')}
                            </button>
                        )}
                        {!isBorrowed && book.availableCopies === 0 && (
                            <button className="btn btn-outline" disabled>
                                Currently Unavailable
                            </button>
                        )}
                        {!user && canBorrow && (
                            <span className="detail-hint">
                                <Link href="/login">Sign in</Link> to {isPhysical ? 'reserve' : 'borrow'} this title.
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {readerOpen && book.ebookUrl && (
                <PdfReader
                    url={book.ebookUrl}
                    title={book.title}
                    onClose={() => setReaderOpen(false)}
                    onProgress={(pageNo, total) => {
                        if (user) void saveReadingProgress(user.uid, book.id, pageNo, total);
                    }}
                />
            )}
        </>
    );
}
