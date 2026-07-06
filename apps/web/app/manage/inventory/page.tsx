'use client';

import { RequireRole } from '@/src/components/RequireRole';
import { useAuth } from '@/src/context/AuthContext';
import { createBook, deleteBook, listBooksByLibrary, updateBook } from '@/src/services/rbacService';
import type { Book } from '@elibrary/types';
import { useCallback, useEffect, useState } from 'react';

export default function InventoryPage() {
    return (
        <RequireRole>
            <InventoryInner />
        </RequireRole>
    );
}

const EMPTY = { title: '', author: '', type: 'ebook' as Book['type'], category: 'General', availableCopies: 1, totalCopies: 1 };

function InventoryInner() {
    const { role, scope } = useAuth();
    // Librarian: default to their first assigned library. Admin: free-form (nationwide).
    const [libraryId, setLibraryId] = useState(scope.assignedLibraryIds?.[0] ?? '');
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!libraryId) { setBooks([]); return; }
        setLoading(true);
        setError(null);
        try {
            setBooks(await listBooksByLibrary(libraryId));
        } catch {
            setError('Could not load inventory.');
        } finally {
            setLoading(false);
        }
    }, [libraryId]);

    useEffect(() => { void load(); }, [load]);

    const handleAdd = async () => {
        if (!libraryId || !form.title.trim()) { setError('A library ID and title are required.'); return; }
        setBusy(true);
        setError(null);
        try {
            const id = (globalThis.crypto?.randomUUID?.() ?? `book-${form.title}`).slice(0, 40);
            await createBook(id, { ...form, libraryId, region: scope.assignedRegion });
            setForm(EMPTY);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Create failed (are you in scope for this library?).');
        } finally {
            setBusy(false);
        }
    };

    const handleAdjust = async (b: Book, delta: number) => {
        const next = Math.max(0, (b.availableCopies ?? 0) + delta);
        try {
            await updateBook(b.id, { availableCopies: next });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed.');
        }
    };

    const handleDelete = async (b: Book) => {
        if (!confirm(`Remove "${b.title}"?`)) return;
        try {
            await deleteBook(b.id);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed.');
        }
    };

    return (
        <>
            <div className="section-head">
                <h2 className="section-title">📚 Manage Inventory</h2>
            </div>
            <p className="detail-hint">
                {role === 'admin'
                    ? 'As an admin you can manage any library — enter a library ID.'
                    : 'You can manage only your assigned library. Writes outside your scope are rejected by the server.'}
            </p>

            <div className="history-item" style={{ gap: 10, flexWrap: 'wrap' }}>
                <input className="form-input" style={{ width: 200 }} placeholder="library ID" value={libraryId} onChange={(e) => setLibraryId(e.target.value)} />
                <button className="btn btn-outline btn-sm" onClick={() => void load()}>Load</button>
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}

            {/* Add book */}
            <div className="section-head" style={{ marginTop: 20 }}><h2 className="section-title">Add a title</h2></div>
            <div className="history-item" style={{ gap: 10, flexWrap: 'wrap' }}>
                <input className="form-input" style={{ width: 200 }} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input className="form-input" style={{ width: 160 }} placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                <select className="form-input" style={{ width: 120 }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Book['type'] })}>
                    <option value="ebook">eBook</option>
                    <option value="physical">Physical</option>
                </select>
                <input className="form-input" style={{ width: 70 }} type="number" min={0} value={form.totalCopies}
                    onChange={(e) => { const n = Number(e.target.value); setForm({ ...form, totalCopies: n, availableCopies: n }); }} />
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={handleAdd}>{busy ? 'Adding…' : 'Add'}</button>
            </div>

            {/* Inventory list */}
            <div className="section-head" style={{ marginTop: 20 }}><h2 className="section-title">Titles in this library</h2></div>
            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : books.length === 0 ? (
                <p className="panel-empty">No titles for this library yet.</p>
            ) : (
                books.map((b) => (
                    <div key={b.id} className="history-item" style={{ gap: 10 }}>
                        <div className="history-item-info">
                            <div className="history-item-title">{b.title}</div>
                            <div className="history-item-author">{b.author} · {b.type} · {b.availableCopies}/{b.totalCopies} available</div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => handleAdjust(b, -1)}>−</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleAdjust(b, +1)}>+</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b)}>Remove</button>
                    </div>
                ))
            )}
        </>
    );
}
