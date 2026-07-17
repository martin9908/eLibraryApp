'use client';

import { RequireRole } from '@/src/components/RequireRole';
import { assignRole, listUsers, type ManagedUser } from '@/src/services/rbacService';
import type { Role } from '@elibrary/types';
import { useCallback, useEffect, useState } from 'react';

const ROLES: Role[] = ['patron', 'librarian', 'admin'];

export default function LibrariansPage() {
    return (
        <RequireRole allow={['admin']}>
            <LibrariansInner />
        </RequireRole>
    );
}

function LibrariansInner() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingUid, setSavingUid] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setUsers(await listUsers());
        } catch {
            setError('Could not load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const handleAssign = async (u: ManagedUser, role: Role, libs: string, region: string) => {
        setSavingUid(u.uid);
        setError(null);
        try {
            await assignRole({
                targetUid: u.uid,
                role,
                assignedLibraryIds: libs.split(',').map((s) => s.trim()).filter(Boolean),
                assignedRegion: region.trim() || undefined,
            });
            await load();
            alert('Role updated. The user must sign out/in (or refresh) for it to take effect.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to assign role.');
        } finally {
            setSavingUid(null);
        }
    };

    return (
        <>
            <div className="section-head">
                <h2 className="section-title">🛡️ Manage Librarians</h2>
            </div>
            <p className="detail-hint">
                Assign roles and library/region scope. Role changes are server-authorized and
                audited; the affected user picks up the change on their next sign-in.
            </p>

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : (
                <div style={{ marginTop: 16 }}>
                    {users.map((u) => (
                        <UserRow key={u.uid} user={u} saving={savingUid === u.uid} onAssign={handleAssign} />
                    ))}
                    {users.length === 0 && <p className="panel-empty">No users found.</p>}
                </div>
            )}
        </>
    );
}

function UserRow({
    user,
    saving,
    onAssign,
}: {
    user: ManagedUser;
    saving: boolean;
    onAssign: (u: ManagedUser, role: Role, libs: string, region: string) => void;
}) {
    const [role, setRole] = useState<Role>(user.role);
    const [libs, setLibs] = useState((user.assignedLibraryIds ?? []).join(', '));
    const [region, setRegion] = useState(user.assignedRegion ?? '');

    return (
        <div className="history-item" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="history-item-info" style={{ minWidth: 200 }}>
                <div className="history-item-title">{user.uid.slice(0, 12)}…</div>
                <div className="history-item-author">
                    current: <strong>{user.role}</strong> · {user.status}
                    {user.homeLibraryId ? ` · home: ${user.homeLibraryId}` : ''}
                </div>
            </div>
            <select className="form-input" style={{ width: 130 }} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {role === 'librarian' && (
                <>
                    <input className="form-input" style={{ width: 160 }} placeholder="library IDs (comma-sep)" value={libs} onChange={(e) => setLibs(e.target.value)} />
                    <input className="form-input" style={{ width: 120 }} placeholder="region" value={region} onChange={(e) => setRegion(e.target.value)} />
                </>
            )}
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => onAssign(user, role, libs, region)}>
                {saving ? 'Saving…' : 'Apply'}
            </button>
        </div>
    );
}
