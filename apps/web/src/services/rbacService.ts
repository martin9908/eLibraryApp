import { supabase } from '@/src/lib/supabase';
import { bookInputToRow, rowToAuditEntry, rowToBook } from '@/src/lib/supabaseMap';
import type { AuditLogRow, BookRow, UserRow } from '@/src/lib/supabaseMap';
import type { AccountStatus, AuditEntry, Book, Role } from '@elibrary/types';

// ── Edge Functions (privileged; service role enforces authz server-side) ──────

type AssignRoleInput = {
    targetUid: string;
    role: Role;
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/**
 * Admin-only: assign/revoke a user's role + librarian scope (US3).
 * Edge Function contract: `assign-role` body `{ targetUid, role, assignedLibraryIds?, assignedRegion? }`.
 */
export async function assignRole(input: AssignRoleInput): Promise<void> {
    const { error } = await supabase.functions.invoke('assign-role', { body: input });
    if (error) throw error;
}

/**
 * Librarian(in-scope)/admin: delete a book (guards against active loans) (US2).
 * Edge Function contract: `delete-book` body `{ bookId }`.
 */
export async function deleteBook(bookId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-book', { body: { bookId } });
    if (error) throw error;
}

/**
 * Suspend/reactivate an account; librarian limited to patrons in scope (US2).
 * Edge Function contract: `set-account-status` body `{ targetUid, status }`.
 */
export async function setAccountStatus(targetUid: string, status: AccountStatus): Promise<void> {
    const { error } = await supabase.functions.invoke('set-account-status', {
        body: { targetUid, status },
    });
    if (error) throw error;
}

/**
 * Update a patron's profile (never role); scoped for librarians (US2).
 * Edge Function contract: `update-patron` body `{ targetUid, changes }`.
 */
export async function updatePatron(
    targetUid: string,
    changes: { homeLibraryId?: string; memberType?: string },
): Promise<void> {
    const { error } = await supabase.functions.invoke('update-patron', {
        body: { targetUid, changes },
    });
    if (error) throw error;
}

// ── Admin: user directory (for the Librarians management screen) ──────────────

export type ManagedUser = {
    uid: string;
    role: Role;
    status: AccountStatus;
    memberType?: string;
    homeLibraryId?: string;
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/** List patrons, optionally restricted to a home library (librarian scope). */
export async function listPatrons(homeLibraryId?: string, max = 100): Promise<ManagedUser[]> {
    let q = supabase.from('users').select('*').eq('role', 'patron');
    if (homeLibraryId) q = q.eq('home_library_id', homeLibraryId);
    const { data, error } = await q.limit(max);
    if (error) throw error;
    return (data as UserRow[]).map(mapManagedUser);
}

function mapManagedUser(row: UserRow): ManagedUser {
    return {
        uid: row.id,
        role: row.role ?? 'patron',
        status: row.status ?? 'active',
        memberType: row.member_type ?? undefined,
        homeLibraryId: row.home_library_id ?? undefined,
        assignedLibraryIds: row.assigned_library_ids ?? undefined,
        assignedRegion: row.assigned_region ?? undefined,
    };
}

/** List users (admin/librarian read per rules). Capped for the management list. */
export async function listUsers(max = 100): Promise<ManagedUser[]> {
    const { data, error } = await supabase.from('users').select('*').limit(max);
    if (error) throw error;
    return (data as UserRow[]).map(mapManagedUser);
}

// ── Inventory writes (direct Supabase; RLS enforces role + library scope) ─────

export type BookInput = {
    title: string;
    author: string;
    type: Book['type'];
    category: string;
    availableCopies: number;
    totalCopies: number;
    libraryId: string;
    region?: string;
    ebookUrl?: string;
    coverImage?: string;
};

/** Create a new book (RLS requires the caller to have scope over libraryId/region). */
export async function createBook(id: string, input: BookInput): Promise<void> {
    const { error } = await supabase.from('books').insert({ id, ...bookInputToRow(input) });
    if (error) throw error;
}

/** Update a book's mutable fields (RLS enforces scope over the existing row). */
export async function updateBook(id: string, changes: Partial<BookInput>): Promise<void> {
    const { error } = await supabase.from('books').update(bookInputToRow(changes)).eq('id', id);
    if (error) throw error;
}

/** Books owned by a specific library (for a librarian's scoped inventory view). */
export async function listBooksByLibrary(libraryId: string, max = 100): Promise<Book[]> {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('library_id', libraryId)
        .limit(max);
    if (error) throw error;
    return (data as BookRow[]).map(rowToBook);
}

// ── Admin: audit log ──────────────────────────────────────────────────────────

/** Recent audit entries, newest first (admin-only per rules). */
export async function listAuditLog(max = 100): Promise<AuditEntry[]> {
    const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(max);
    if (error) throw error;
    return (data as AuditLogRow[]).map(rowToAuditEntry);
}
