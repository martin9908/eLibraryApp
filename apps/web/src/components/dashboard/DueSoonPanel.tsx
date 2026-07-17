import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import type { DueSoonEntry } from '@elibrary/types';
import Link from 'next/link';

function formatDate(seconds?: number): string {
    if (!seconds) return '';
    return new Date(seconds * 1000).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

export function DueSoonPanel({ items, loading }: { items: DueSoonEntry[]; loading: boolean }) {
    return (
        <section className="dash-panel" aria-label={S.dueSoon.title}>
            <div className="dash-panel-head">
                <span className="dash-panel-title">⏳ {S.dueSoon.title}</span>
                <Link href="/account" className="section-link">{S.dueSoon.viewAll} →</Link>
            </div>

            {loading ? (
                <div className="panel-skeleton">
                    <div className="skeleton skel-line" />
                    <div className="skeleton skel-line short" />
                </div>
            ) : items.length === 0 ? (
                <p className="panel-empty">{S.dueSoon.empty}</p>
            ) : (
                <div className="due-list">
                    {items.map((item) => (
                        <Link key={item.id} href={`/catalog/${item.bookId}`} className="due-item">
                            <div className="due-body">
                                <div className="due-title">{item.book?.title ?? item.bookId}</div>
                                <div className="due-date">{S.dueSoon.dueOn(formatDate(item.dueDate?.seconds))}</div>
                            </div>
                            {/* Urgency conveyed by text + icon, not color alone (FR-017) */}
                            <span className={`urgency-pill ${item.urgency === 'overdue' ? 'overdue' : 'due-soon'}`}>
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
