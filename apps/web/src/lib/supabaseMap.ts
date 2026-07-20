/**
 * supabaseMap — translation layer between Postgres (snake_case rows) and the
 * shared camelCase domain types (`@elibrary/types`).
 *
 * Firestore returned `Timestamp` objects; Postgres returns `timestamptz` as ISO
 * strings. `toTimestamp` wraps those strings in a structural `FirestoreTimestamp`
 * so existing consumers that call `.toDate()` / read `.seconds` keep working
 * unchanged after the Firebase → Supabase migration.
 */
import type {
    AuditEntry,
    Book,
    BorrowRecord,
    FirestoreTimestamp,
    Library,
    LibraryHours,
    Notification,
    ReadingProgress,
    Role,
    UserProfile,
} from '@elibrary/types';

/**
 * Wrap a Postgres `timestamptz` ISO string in the structural FirestoreTimestamp
 * shape so consumers calling `.toDate()` / reading `.seconds` keep working.
 */
export function toTimestamp(iso?: string | null): FirestoreTimestamp | undefined {
    if (!iso) return undefined;
    const d = new Date(iso);
    const ms = d.getTime();
    return { seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6, toDate: () => d };
}

// ── Row shapes (snake_case, as returned by the Supabase client) ──────────────

export type BookRow = {
    id: string;
    title: string | null;
    author: string | null;
    type: Book['type'] | null;
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
    type: BorrowRecord['type'] | null;
    borrowed_at: string | null;
    due_date: string | null;
    returned_at: string | null;
    returned: boolean | null;
};

export type NotificationRow = {
    id: string;
    user_id: string | null;
    category: Notification['category'] | null;
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

export type UserRow = {
    id: string;
    home_library_id: string | null;
    member_type: UserProfile['memberType'] | null;
    role: Role | null;
    status: UserProfile['status'] | null;
    assigned_library_ids: string[] | null;
    assigned_region: string | null;
};

export type AuditLogRow = {
    id: string;
    actor_uid: string | null;
    actor_role: Role | null;
    action: string | null;
    target_type: AuditEntry['targetType'] | null;
    target_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string | null;
};

// ── row → model ──────────────────────────────────────────────────────────────

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

export function rowToNotification(row: NotificationRow): Notification {
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

export function rowToUserProfile(row: UserRow): UserProfile {
    return {
        homeLibraryId: row.home_library_id ?? undefined,
        memberType: row.member_type ?? undefined,
        role: row.role ?? undefined,
        status: row.status ?? undefined,
        assignedLibraryIds: row.assigned_library_ids ?? undefined,
        assignedRegion: row.assigned_region ?? undefined,
    };
}

export function rowToAuditEntry(row: AuditLogRow): AuditEntry {
    return {
        id: row.id,
        actorUid: row.actor_uid ?? '',
        actorRole: row.actor_role ?? 'patron',
        action: row.action ?? '',
        targetType: row.target_type ?? 'user',
        targetId: row.target_id ?? '',
        details: row.details ?? undefined,
        createdAt: toTimestamp(row.created_at),
    };
}

// ── model → row (for inserts/updates; camelCase → snake_case) ─────────────────

/** Columns writable when creating/updating a catalog book (RBAC-scoped write). */
export type BookRowInput = {
    title?: string;
    author?: string;
    type?: Book['type'];
    category?: string;
    available_copies?: number;
    total_copies?: number;
    library_id?: string;
    region?: string;
    ebook_url?: string;
    cover_image?: string;
};

/**
 * Map camelCase book input to a snake_case row for insert/update. Undefined
 * fields are omitted so updates only touch the columns the caller provided.
 */
export function bookInputToRow(input: {
    title?: string;
    author?: string;
    type?: Book['type'];
    category?: string;
    availableCopies?: number;
    totalCopies?: number;
    libraryId?: string;
    region?: string;
    ebookUrl?: string;
    coverImage?: string;
}): BookRowInput {
    const row: BookRowInput = {};
    if (input.title !== undefined) row.title = input.title;
    if (input.author !== undefined) row.author = input.author;
    if (input.type !== undefined) row.type = input.type;
    if (input.category !== undefined) row.category = input.category;
    if (input.availableCopies !== undefined) row.available_copies = input.availableCopies;
    if (input.totalCopies !== undefined) row.total_copies = input.totalCopies;
    if (input.libraryId !== undefined) row.library_id = input.libraryId;
    if (input.region !== undefined) row.region = input.region;
    if (input.ebookUrl !== undefined) row.ebook_url = input.ebookUrl;
    if (input.coverImage !== undefined) row.cover_image = input.coverImage;
    return row;
}
