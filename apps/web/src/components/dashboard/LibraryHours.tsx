import { isOpenNow } from '@/src/services/libraryBranchService';
import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import type { Library } from '@elibrary/types';
import Link from 'next/link';

export function LibraryHours({ library, loading }: { library: Library | null; loading: boolean }) {
    if (loading) {
        return (
            <section className="dash-panel" aria-label={S.libraryHours.title}>
                <div className="dash-panel-head"><span className="dash-panel-title">🕒 {S.libraryHours.title}</span></div>
                <div className="panel-skeleton"><div className="skeleton skel-line" /><div className="skeleton skel-line short" /></div>
            </section>
        );
    }

    // Member has not chosen a home library yet — prompt them (nationwide edge case).
    if (!library) {
        return (
            <section className="dash-panel" aria-label={S.libraryHours.title}>
                <div className="dash-panel-head"><span className="dash-panel-title">🕒 {S.libraryHours.title}</span></div>
                <div className="hours-name">{S.libraryHours.chooseLibraryTitle}</div>
                <p className="panel-empty">{S.libraryHours.chooseLibraryBody}</p>
                <Link href="/account" className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
                    {S.libraryHours.chooseLibraryCta}
                </Link>
            </section>
        );
    }

    const open = isOpenNow(library);
    return (
        <section className="dash-panel" aria-label={S.libraryHours.title}>
            <div className="dash-panel-head">
                <span className="dash-panel-title">🕒 {S.libraryHours.title}</span>
                <span className={`hours-status ${open ? 'open' : 'closed'}`}>
                    {open ? S.libraryHours.openNow : S.libraryHours.closed}
                </span>
            </div>
            <div className="hours-name">{library.name}</div>
            {library.hours ? (
                <div className="hours-detail">
                    {library.hours.days}: {library.hours.open} – {library.hours.close}
                </div>
            ) : (
                <div className="hours-detail">{S.libraryHours.hoursUnavailable}</div>
            )}
            {library.contact && <div className="hours-detail">{library.contact}</div>}
        </section>
    );
}
