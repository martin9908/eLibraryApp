import type { Book } from '@elibrary/types';
import Link from 'next/link';

export function BookCard({ book }: { book: Book }) {
    const initials = book.title.slice(0, 2).toUpperCase();
    return (
        <Link href={`/catalog/${book.id}`} className="book-card">
            <div className="book-cover">
                {book.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverImage} alt={book.title} />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
                <div className="book-meta-row">
                    <span className={`badge badge-${book.type}`}>
                        {book.type === 'ebook' ? '📱 eBook' : '📗 Physical'}
                    </span>
                    <span className={book.availableCopies > 0 ? 'avail-ok' : 'avail-none'}>
                        {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Unavailable'}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function BookCardSkeleton() {
    return (
        <div className="skel-card">
            <div className="skeleton skel-cover" />
            <div className="skeleton skel-line" />
            <div className="skeleton skel-line short" />
        </div>
    );
}

export function BookGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <div className="book-grid">
            {Array.from({ length: count }).map((_, i) => (
                <BookCardSkeleton key={i} />
            ))}
        </div>
    );
}
