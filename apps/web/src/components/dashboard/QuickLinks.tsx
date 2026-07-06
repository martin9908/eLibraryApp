import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import Link from 'next/link';

const LINKS = [
    { emoji: '🔖', label: S.quickLinks.reserve, href: '/catalog' },
    { emoji: '📋', label: S.quickLinks.rules, href: '/account' },
    { emoji: '📘', label: S.quickLinks.guide, href: '/account' },
    { emoji: '✉️', label: S.quickLinks.contact, href: '/account' },
];

export function QuickLinks() {
    return (
        <section className="dash-panel" aria-label={S.quickLinks.title}>
            <div className="dash-panel-head"><span className="dash-panel-title">✨ {S.quickLinks.title}</span></div>
            <div className="quicklinks-grid">
                {LINKS.map((l) => (
                    <Link key={l.label} href={l.href} className="quicklink">
                        <span aria-hidden>{l.emoji}</span> {l.label}
                    </Link>
                ))}
            </div>
        </section>
    );
}
