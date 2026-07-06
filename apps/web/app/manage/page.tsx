'use client';

import { useAuth } from '@/src/context/AuthContext';
import { canManageLibrarians } from '@/src/lib/access';
import { RequireRole } from '@/src/components/RequireRole';
import Link from 'next/link';

/**
 * Management home for librarians and admins (feature 002, US1 gate).
 * Patrons and unauthenticated users are redirected by RequireRole.
 *
 * The area cards are placeholders here; the Inventory / Patrons / Librarians
 * sub-pages are implemented in US2 (librarian) and US3 (admin).
 */
export default function ManageHome() {
    return (
        <RequireRole>
            <ManageHomeInner />
        </RequireRole>
    );
}

function ManageHomeInner() {
    const { user, role, scope } = useAuth();

    const scopeLabel =
        role === 'admin'
            ? 'Nationwide'
            : [scope.assignedRegion, ...(scope.assignedLibraryIds ?? [])].filter(Boolean).join(', ') ||
              'No libraries assigned yet';

    const areas: { key: string; title: string; desc: string; href?: string; show: boolean }[] = [
        { key: 'inventory', title: '📚 Inventory', desc: 'Add, edit, and remove titles and copies for your library.', href: '/manage/inventory', show: true },
        { key: 'patrons', title: '👥 Patrons', desc: 'View, assist, and manage patron accounts (coming soon).', show: true },
        { key: 'librarians', title: '🛡️ Librarians', desc: 'Assign roles and library/region scope.', href: '/manage/librarians', show: canManageLibrarians(role) },
        { key: 'audit', title: '🧾 Audit Log', desc: 'Review privileged actions (coming soon).', show: canManageLibrarians(role) },
    ];

    return (
        <>
            <div className="account-header">
                <div className="avatar">{role === 'admin' ? '★' : '📖'}</div>
                <div>
                    <div className="account-name">Management</div>
                    <div className="account-email">
                        {user?.displayName ?? 'Staff'} · <strong>{role}</strong> · {scopeLabel}
                    </div>
                </div>
            </div>

            <div className="section-head">
                <h2 className="section-title">Management areas</h2>
            </div>
            <div className="dash-browse" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {areas.filter((a) => a.show).map((a) =>
                    a.href ? (
                        <Link key={a.key} href={a.href} className="dash-panel" aria-label={a.title} style={{ textDecoration: 'none' }}>
                            <div className="dash-panel-title">{a.title}</div>
                            <p className="panel-empty">{a.desc}</p>
                        </Link>
                    ) : (
                        <div key={a.key} className="dash-panel" aria-label={a.title}>
                            <div className="dash-panel-title">{a.title}</div>
                            <p className="panel-empty">{a.desc}</p>
                        </div>
                    ),
                )}
            </div>

            <p className="detail-hint" style={{ marginTop: 16 }}>
                Management tools are being rolled out. Actions are enforced server-side by role and
                library/region scope — this view only shows what your role permits.
            </p>
        </>
    );
}
