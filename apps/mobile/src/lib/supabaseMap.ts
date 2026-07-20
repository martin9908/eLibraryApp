// Supabase <-> app-model mappers (mobile). Firebase -> Supabase migration.
//
// Supabase rows are snake_case with timestamptz columns serialized as ISO
// strings; the app's TS models (see `@/src/types/library`) are camelCase and
// were built around Firebase `Timestamp` objects. These helpers bridge the two:
//   * `toTimestamp` wraps an ISO string in a structural `FirestoreTimestamp`
//     so existing consumers (`.toDate()`, `.seconds`) keep working unchanged.
//   * `rowTo*` translate a raw row into the corresponding camelCase model.

import type {
    AppNotification,
    Book,
    BorrowRecord,
    BookType,
    FirestoreTimestamp,
    Library,
    LibraryHours,
    NotificationCategory,
    ReadingProgress,
    UserProfile,
} from '@/src/types/library';

/**
 * Wrap a timestamptz ISO string in a structural object that mirrors the parts
 * of the Firebase `Timestamp` API the app actually uses (`.seconds`,
 * `.nanoseconds`, `.toDate()`). Returns undefined for null/empty/invalid input
 * so optional model fields stay optional.
 */
export function toTimestamp(iso: string | null | undefined): FirestoreTimestamp | undefined {
    if (!iso) return undefined;
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) return undefined;
    const seconds = Math.floor(ms / 1000);
    const nanoseconds = (ms - seconds * 1000) * 1_000_000;
    return {
        seconds,
        nanoseconds,
        toDate: () => new Date(ms),
    };
}

// ── Raw row shapes (snake_case, as returned by supabase-js) ──────────────────

export type BookRow = {
    id: string;
    title: string | null;
    author: string | null;
    type: BookType | null;
    category: string | null;
    available_copies: number | null;
    total_copies: number | null;
    ebook_url: string | null;
    ebook_storage_path: string | null;
    cover_image: string | null;
    featured: boolean | null;
    library_id: string | null;
    region: string | null;
    created_at: string | null;
};

export type BorrowRecordRow = {
    id: string;
    user_id: string | null;
    book_id: string | null;
    type: BookType | null;
    borrowed_at: string | null;
    due_date: string | null;
    returned_at: string | null;
    returned: boolean | null;
};

export type NotificationRow = {
    id: string;
    user_id: string | null;
    category: NotificationCategory | null;
    title: string | null;
    body: string | null;
    read: boolean | null;
    created_at: string | null;
};

export type ReadingProgressRow = {
    id: string;
    user_id: string | null;
    book_id: string | null;
    current_page: number | null;
    total_pages: number | null;
    updated_at: string | null;
};

export type LibraryRow = {
    id: string;
    name: string | null;
    region: string | null;
    hours: LibraryHours | null;
    contact: string | null;
};

export type UserProfileRow = {
    home_library_id: string | null;
    member_type: UserProfile['memberType'] | null;
    role: UserProfile['role'] | null;
    status: UserProfile['status'] | null;
    assigned_library_ids: string[] | null;
    assigned_region: string | null;
};

// ── row -> model ─────────────────────────────────────────────────────────────

export function rowToBook(row: BookRow): Book {
    return {
        id: row.id,
        title: row.title ?? 'Untitled',
        author: row.author ?? 'Unknown author',
        type: row.type ?? 'ebook',
        category: row.category ?? 'General',
        availableCopies: row.available_copies ?? 0,
        totalCopies: row.total_copies ?? 0,
        ebookUrl: row.ebook_url ?? undefined,
        ebookStoragePath: row.ebook_storage_path ?? undefined,
        coverImage: row.cover_image ?? undefined,
        createdAt: toTimestamp(row.created_at),
        featured: row.featured ?? undefined,
        libraryId: row.library_id ?? undefined,
        region: row.region ?? undefined,
    };
}

export function rowToBorrowRecord(row: BorrowRecordRow): BorrowRecord {
    return {
        id: row.id,
        userId: row.user_id ?? '',
        bookId: row.book_id ?? '',
        type: row.type ?? 'ebook',
        borrowedAt: toTimestamp(row.borrowed_at),
        dueDate: toTimestamp(row.due_date),
        returnedAt: toTimestamp(row.returned_at),
        returned: Boolean(row.returned),
    };
}

export function rowToNotification(row: NotificationRow): AppNotification {
    return {
        id: row.id,
        userId: row.user_id ?? '',
        category: row.category ?? 'general',
        title: row.title ?? '',
        body: row.body ?? undefined,
        read: Boolean(row.read),
        createdAt: toTimestamp(row.created_at),
    };
}

export function rowToReadingProgress(row: ReadingProgressRow): ReadingProgress {
    return {
        id: row.id,
        userId: row.user_id ?? '',
        bookId: row.book_id ?? '',
        currentPage: row.current_page ?? 1,
        totalPages: row.total_pages ?? 0,
        updatedAt: toTimestamp(row.updated_at),
    };
}

export function rowToLibrary(row: LibraryRow): Library {
    return {
        id: row.id,
        name: row.name ?? 'Local Library',
        region: row.region ?? '',
        hours: row.hours ?? undefined,
        contact: row.contact ?? undefined,
    };
}

export function rowToUserProfile(row: UserProfileRow): UserProfile {
    return {
        homeLibraryId: row.home_library_id ?? undefined,
        memberType: row.member_type ?? undefined,
        role: row.role ?? undefined,
        status: row.status ?? undefined,
        assignedLibraryIds: row.assigned_library_ids ?? undefined,
        assignedRegion: row.assigned_region ?? undefined,
    };
}
