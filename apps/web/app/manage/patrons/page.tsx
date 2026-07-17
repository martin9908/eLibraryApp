'use client';

import { RequireRole } from '@/src/components/RequireRole';
import { useAuth } from '@/src/context/AuthContext';
import { listPatrons, setAccountStatus, updatePatron, type ManagedUser } from '@/src/services/rbacService';
import { useCallback, useEffect, useState } from 'react';

export default function PatronsPage() {
    return (
        <RequireRole>
            <PatronsInner />
        </RequireRole>
    );
}

function PatronsInner() {
    const { role, scope } = useAuth();
    // Librarians see only their library's patrons; admins see all (optionally filtered).
    const defaultLib = role === 'librarian' ? (scope.assignedLibraryIds?.[0] ?? '') : '';
    const [libraryId, setLibraryId] = useState(defaultLib);
    const [patrons, setPatrons] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyUid, setBusyUid] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Librarian is always constrained to a library; admin may list all.
            const filter = role === 'librarian' ? (libraryId || '__none__') : (libraryId || undefined);
            setPatrons(await listPatrons(filter === '__none__' ? '__none__' : filter));
        } catch {
            setError('Could not load patrons.');
        } finally {
            setLoading(false);
        }
    }, [role, libraryId]);

    useEffect(() => { void load(); }, [load]);

    const toggleStatus = async (p: ManagedUser) => {
        setBusyUid(p.uid);
        setError(null);
        try {
            await setAccountStatus(p.uid, p.status === 'suspended' ? 'active' : 'suspended');
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Action failed.');
        } finally {
            setBusyUid(null);
        }
    };

    const editMemberType = async (p: ManagedUser, memberType: string) => {
        setBusyUid(p.uid);
        setError(null);
        try {
            await updatePatron(p.uid, { memberType });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed.');
        } finally {
            setBusyUid(null);
        }
    };

    return (
        <>
            <div className="section-head">
                <h2 className="section-title">👥 Manage Patrons</h2>
            </div>
            <p className="detail-hint">
                {role === 'admin'
                    ? 'Filter by a library ID, or leave blank to list all patrons.'
                    : 'You can manage only patrons whose home library is in your scope.'}
            </p>

            <div className="history-item" style={{ gap: 10, flexWrap: 'wrap' }}>
                <input className="form-input" style={{ width: 200 }} placeholder="library ID (home library)"
                    value={libraryId} onChange={(e) => setLibraryId(e.target.value)} />
                <button className="btn btn-outline btn-sm" onClick={() => void load()}>Load</button>
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : patrons.length === 0 ? (
                <p className="panel-empty">No patrons found for this filter.</p>
            ) : (
                <div style={{ marginTop: 12 }}>
                    {patrons.map((p) => (
                        <div key={p.uid} className="history-item" style={{ gap: 10, flexWrap: 'wrap' }}>
                            <div className="history-item-info" style={{ minWidth: 200 }}>
                                <div className="history-item-title">{p.uid.slice(0, 12)}…</div>
                                <div className="history-item-author">
                                    {p.memberType ?? 'Member'} · {p.status}
                                    {p.homeLibraryId ? ` · ${p.homeLibraryId}` : ''}
                                </div>
                            </div>
                            <select className="form-input" style={{ width: 130 }} value={p.memberType ?? 'Community'}
                                disabled={busyUid === p.uid}
                                onChange={(e) => void editMemberType(p, e.target.value)}>
                                {['Student', 'Teacher', 'Parent', 'Community'].map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <button
                                className={`btn btn-sm ${p.status === 'suspended' ? 'btn-primary' : 'btn-danger'}`}
                                disabled={busyUid === p.uid}
                                onClick={() => toggleStatus(p)}>
                                {busyUid === p.uid ? '…' : p.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
