'use client';

import { useAuth } from '@/src/context/AuthContext';
import { getAllBorrowRecords, getBooksByIds, returnBook } from '@/src/services/libraryService';
import type { BorrowEntry } from '@elibrary/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function AccountPage() {
    const { user, initialising, signOut } = useAuth();
    const router = useRouter();

    const [entries, setEntries] = useState<BorrowEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [returningId, setReturningId] = useState<string | null>(null);

    useEffect(() => {
        if (!initialising && !user) router.push('/login');
    }, [user, initialising, router]);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const records = await getAllBorrowRecords(user.uid);
            const ids = Array.from(new Set(records.map((r) => r.bookId)));
            const bookMap = await getBooksByIds(ids);
            setEntries(records.map((r) => ({ ...r, book: bookMap.get(r.bookId) ?? null })));
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { void load(); }, [load]);

    const handleReturn = async (entry: BorrowEntry) => {
        if (!confirm(`Return "${entry.book?.title ?? 'this book'}"?`)) return;
        setReturningId(entry.id);
        try {
            await returnBook(entry.id, entry.bookId);
            await load();
        } catch {
            alert('Could not return the book. Please try again.');
        } finally {
            setReturningId(null);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (initialising || !user) {
        return <div className="loading-container"><div className="spinner" /></div>;
    }

    const active = entries.filter((e) => !e.returned);
    const history = entries.filter((e) => e.returned);
    const initials = (user.displayName ?? user.email ?? '?').slice(0, 2).toUpperCase();

    const renderEntry = (entry: BorrowEntry, kind: 'active' | 'history') => {
        const thumbInitials = (entry.book?.title ?? '?').slice(0, 2).toUpperCase();
        return (
            <div key={entry.id} className="history-item">
                <div className="history-thumb">
                    {entry.book?.coverImage ? (
                        <Image src={entry.book.coverImage} alt={entry.book.title} fill sizes="44px" />
                    ) : (
                        <span>{thumbInitials}</span>
                    )}
                </div>
                <div className="history-item-info">
                    <Link href={`/catalog/${entry.bookId}`} className="history-item-title">
                        {entry.book?.title ?? entry.bookId}
                    </Link>
                    <div className="history-item-author">{entry.book?.author}</div>
                    <div className="history-item-dates">
                        {kind === 'active'
                            ? entry.dueDate && `Due ${new Date(entry.dueDate.seconds * 1000).toLocaleDateString()}`
                            : (
                                <>
                                    {entry.borrowedAt && `Borrowed ${new Date(entry.borrowedAt.seconds * 1000).toLocaleDateString()}`}
                                    {entry.returnedAt && ` · Returned ${new Date(entry.returnedAt.seconds * 1000).toLocaleDateString()}`}
                                </>
                            )}
                    </div>
                </div>
                {kind === 'active' ? (
                    <>
                        <span className="badge badge-active">{entry.type === 'ebook' ? '📱 eBook' : '📗 Physical'}</span>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReturn(entry)}
                            disabled={returningId !== null}>
                            {returningId === entry.id ? 'Returning…' : 'Return'}
                        </button>
                    </>
                ) : (
                    <span className="badge badge-returned">✓ Returned</span>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Profile header */}
            <div className="account-header">
                <div className="avatar">{initials}</div>
                <div>
                    <div className="account-name">{user.displayName ?? 'Reader'}</div>
                    <div className="account-email">{user.email}</div>
                </div>
                <button className="btn btn-ghost-light btn-sm account-signout" onClick={handleSignOut}>
                    Sign Out
                </button>
            </div>

            {/* Stats */}
            <div className="stat-row">
                <div className="stat-tile">
                    <div className="stat-figure grad">{active.length}</div>
                    <div className="stat-label">Currently borrowed</div>
                </div>
                <div className="stat-tile">
                    <div className="stat-figure grad">{history.length}</div>
                    <div className="stat-label">Books returned</div>
                </div>
                <div className="stat-tile">
                    <div className="stat-figure grad">{entries.length}</div>
                    <div className="stat-label">Total borrows</div>
                </div>
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Active borrows */}
                    <div className="section-head">
                        <h2 className="section-title">Active Borrows</h2>
                    </div>
                    {active.length === 0 ? (
                        <div className="empty-state" style={{ marginBottom: 24 }}>
                            <span className="empty-emoji">📖</span>
                            <div className="empty-title">Nothing borrowed yet</div>
                            <p><Link href="/catalog" style={{ color: 'var(--indigo-600)', fontWeight: 700 }}>Browse the collection</Link> to get started.</p>
                        </div>
                    ) : (
                        active.map((entry) => renderEntry(entry, 'active'))
                    )}

                    {/* History */}
                    <div className="section-head">
                        <h2 className="section-title">Reading History</h2>
                    </div>
                    {history.length === 0 ? (
                        <p style={{ color: 'var(--muted)' }}>No returned books yet.</p>
                    ) : (
                        history.map((entry) => renderEntry(entry, 'history'))
                    )}
                </>
            )}
        </>
    );
}
