'use client';

import { RequireRole } from '@/src/components/RequireRole';
import { listAuditLog } from '@/src/services/rbacService';
import type { AuditEntry } from '@elibrary/types';
import { useCallback, useEffect, useState } from 'react';

export default function AuditPage() {
    return (
        <RequireRole allow={['admin']}>
            <AuditInner />
        </RequireRole>
    );
}

function formatWhen(seconds?: number): string {
    if (!seconds) return '—';
    return new Date(seconds * 1000).toLocaleString();
}

function AuditInner() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setEntries(await listAuditLog());
        } catch {
            setError('Could not load the audit log.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    return (
        <>
            <div className="section-head">
                <h2 className="section-title">🧾 Audit Log</h2>
            </div>
            <p className="detail-hint">
                Privileged actions (role changes, deletions, suspensions) are recorded
                server-side and are read-only here.
            </p>

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}

            {loading ? (
                <div className="loading-container"><div className="spinner" /></div>
            ) : entries.length === 0 ? (
                <p className="panel-empty">No audit entries yet.</p>
            ) : (
                <div style={{ marginTop: 12 }}>
                    {entries.map((e) => (
                        <div key={e.id} className="history-item">
                            <div className="history-item-info">
                                <div className="history-item-title">
                                    <strong>{e.action}</strong> · {e.targetType}:{e.targetId.slice(0, 12)}…
                                </div>
                                <div className="history-item-author">
                                    by {e.actorRole} ({e.actorUid.slice(0, 8)}…) · {formatWhen(e.createdAt?.seconds)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
