'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getAllBorrowRecords, getBooksByIds, returnBook } from '@/src/services/libraryService';
import type { BorrowEntry } from '@elibrary/types';

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

    return (
        <>
            {/* Profile header */}
            <div className="account-header">
                <div className="avatar">{initials}</div>
                <div>
                    <div className="account-name">{user.displayName ?? 'Patron'}</div>
                    <div className="account-email">{user.email}</div>
                </div>
                <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={handleSignOut}>
                    Sign Out
                </button>
            </div>

            <hr className="divider" />

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : (
                <>
                    {/* Active borrows */}
                    <h2 className="section-title">Active Borrows ({active.length})</h2>
                    {active.length === 0 ? (
                        <p style={{ color: '#888', marginBottom: 24 }}>No active borrows.</p>
                    ) : (
                        active.map((entry) => (
                            <div key={entry.id} className="history-item">
                                <div className="history-item-info">
                                    <Link href={`/catalog/${entry.bookId}`} className="history-item-title" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {entry.book?.title ?? entry.bookId}
                                    </Link>
                                    <div className="history-item-author">{entry.book?.author}</div>
                                    <div className="history-item-dates">
                                        {entry.dueDate && `Due: ${new Date(entry.dueDate.seconds * 1000).toLocaleDateString()}`}
                                    </div>
                                </div>
                                <span className="badge badge-active">{entry.type === 'ebook' ? 'eBook' : 'Physical'}</span>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleReturn(entry)}
                                    disabled={returningId !== null}>
                                    {returningId === entry.id ? 'Returning…' : 'Return'}
                                </button>
                            </div>
                        ))
                    )}

                    <hr className="divider" />

                    {/* History */}
                    <h2 className="section-title">History ({history.length})</h2>
                    {history.length === 0 ? (
                        <p style={{ color: '#888' }}>No returned books yet.</p>
                    ) : (
                        history.map((entry) => (
                            <div key={entry.id} className="history-item">
                                <div className="history-item-info">
                                    <Link href={`/catalog/${entry.bookId}`} className="history-item-title" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {entry.book?.title ?? entry.bookId}
                                    </Link>
                                    <div className="history-item-author">{entry.book?.author}</div>
                                    <div className="history-item-dates">
                                        {entry.borrowedAt && `Borrowed: ${new Date(entry.borrowedAt.seconds * 1000).toLocaleDateString()}`}
                                        {entry.returnedAt && ` · Returned: ${new Date(entry.returnedAt.seconds * 1000).toLocaleDateString()}`}
                                    </div>
                                </div>
                                <span className="badge badge-returned">Returned</span>
                            </div>
                        ))
                    )}
                </>
            )}
        </>
    );
}
