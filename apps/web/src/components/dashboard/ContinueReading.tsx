import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import type { ReadingProgressEntry } from '@elibrary/types';
import Link from 'next/link';

export function ContinueReading({ items, loading }: { items: ReadingProgressEntry[]; loading: boolean }) {
    return (
        <section aria-label={S.continueReading.title}>
            <div className="section-head">
                <h2 className="section-title">{S.continueReading.title}</h2>
                <Link href="/account" className="section-link">{S.continueReading.viewAll} →</Link>
            </div>

            {loading ? (
                <div className="dash-continue">
                    <div className="skeleton skel-line" />
                    <div className="skeleton skel-line" />
                </div>
            ) : items.length === 0 ? (
                <p className="panel-empty">{S.continueReading.empty}</p>
            ) : (
                <div className="dash-continue">
                    {items.map(({ progress, book }) => {
                        const pct = progress.totalPages > 0
                            ? Math.min(100, Math.round((progress.currentPage / progress.totalPages) * 100))
                            : 0;
                        const initials = (book?.title ?? '?').slice(0, 2).toUpperCase();
                        return (
                            // Resume link into the existing reader (FR-014).
                            <Link key={progress.id} href={`/catalog/${progress.bookId}`} className="continue-item">
                                <span className="continue-thumb">
                                    {book?.coverImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={book.coverImage} alt={book.title} />
                                    ) : (
                                        <span>{initials}</span>
                                    )}
                                </span>
                                <span className="continue-body">
                                    <span className="continue-title">{book?.title ?? progress.bookId}</span>
                                    <span className="continue-progress-track" aria-hidden>
                                        <span className="continue-progress-fill" style={{ width: `${pct}%` }} />
                                    </span>
                                    <span className="continue-page">
                                        {S.continueReading.pageOf(progress.currentPage, progress.totalPages)}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
