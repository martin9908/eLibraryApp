import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import type { Notification, NotificationCategory } from '@elibrary/types';

const CATEGORY_ICON: Record<NotificationCategory, string> = {
    availability: '📗',
    dueReminder: '⏰',
    returnConfirm: '✅',
    general: '🔔',
};

function timeAgo(seconds?: number): string {
    if (!seconds) return '';
    const diff = Date.now() - seconds * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

type Props = {
    items: Notification[];
    unread: number;
    loading: boolean;
    onMarkAll: () => void;
    onMarkOne: (id: string) => void;
};

export function NotificationsPanel({ items, unread, loading, onMarkAll, onMarkOne }: Props) {
    return (
        <section className="dash-panel" aria-label={S.notifications.title}>
            <div className="dash-panel-head">
                <span className="dash-panel-title">
                    🔔 {S.notifications.title}
                    {/* aria-live so assistive tech announces the unread count (FR-017) */}
                    <span aria-live="polite" className="badge" style={{ marginLeft: 6 }}>
                        {unread > 0 ? unread : ''}
                    </span>
                    <span className="sr-only" aria-live="polite">{S.notifications.unreadLabel(unread)}</span>
                </span>
                {unread > 0 && (
                    <button type="button" className="section-link" onClick={onMarkAll}>
                        {S.notifications.markAll}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="panel-skeleton">
                    <div className="skeleton skel-line" />
                    <div className="skeleton skel-line short" />
                </div>
            ) : items.length === 0 ? (
                <p className="panel-empty">{S.notifications.empty}</p>
            ) : (
                <div className="notif-list">
                    {items.map((n) => (
                        <button
                            key={n.id}
                            type="button"
                            className={`notif-item${n.read ? '' : ' unread'}`}
                            onClick={() => !n.read && onMarkOne(n.id)}
                            aria-label={`${n.read ? '' : 'Unread: '}${n.title}`}
                        >
                            <span className="notif-icon" aria-hidden>{CATEGORY_ICON[n.category]}</span>
                            <span className="notif-body-wrap">
                                <span className="notif-title">{n.title}</span>
                                {n.body && <span className="notif-text">{n.body}</span>}
                                <span className="notif-time">{timeAgo(n.createdAt?.seconds)}</span>
                            </span>
                            {!n.read && <span className="notif-unread-dot" aria-hidden />}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
