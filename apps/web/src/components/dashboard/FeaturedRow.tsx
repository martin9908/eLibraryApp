import { BookCard, BookGridSkeleton } from '@/src/components/BookCard';
import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import type { Book } from '@elibrary/types';
import Link from 'next/link';

export function FeaturedRow({ books, loading }: { books: Book[]; loading: boolean }) {
    return (
        <section aria-label={S.featured.title}>
            <div className="section-head">
                <h2 className="section-title">{S.featured.title}</h2>
                <Link href="/catalog?type=ebook" className="section-link">{S.featured.viewAll} →</Link>
            </div>
            {loading ? (
                <BookGridSkeleton count={4} />
            ) : books.length === 0 ? (
                <p className="panel-empty">{S.featured.empty}</p>
            ) : (
                // BookCard already renders availability ("N available" / "Unavailable"),
                // satisfying FR-013/FR-015.
                <div className="book-grid">
                    {books.map((book) => <BookCard key={book.id} book={book} />)}
                </div>
            )}
        </section>
    );
}
