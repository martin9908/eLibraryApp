import { collection, doc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '@/src/lib/firebase';
import type { AccountStatus, AuditEntry, Book, Role } from '@elibrary/types';

// ── Callables (privileged; Admin SDK enforces authz server-side) ──────────────

type AssignRoleInput = {
    targetUid: string;
    role: Role;
    assignedLibraryIds?: string[];
    assignedRegion?: string;
};

/** Admin-only: assign/revoke a user's role + librarian scope (US3). */
export async function assignRole(input: AssignRoleInput): Promise<void> {
    await httpsCallable(functions, 'assignRole')(input);
}

/** Librarian(in-scope)/admin: delete a book (guards against active loans) (US2). */
export async function deleteBook(bookId: string): Promise<void> {
    await httpsCallable(functions, 'deleteBook')({ bookId });
}

/** Suspend/reactivate an account; librarian limited to patrons in scope (US2). */
export async function setAccountStatus(targetUid: string, status: AccountStatus): Promise<void> {
    await httpsCallable(functions, 'setAccountStatus')({ targetUid, status });
}

/** Update a patron's profile (never role); scoped for librarians (US2). */
export async function updatePatron(
    targetUid: string,
    changes: { homeLibraryId?: string; memberType?: string },
): Promise<void> {
    await httpsCallable(functions, 'updatePatron')({ targetUid, changes });
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
    const ref = collection(db, 'users');
    const q = homeLibraryId
        ? query(ref, where('role', '==', 'patron'), where('homeLibraryId', '==', homeLibraryId), limit(max))
        : query(ref, where('role', '==', 'patron'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapManagedUser(d.id, d.data()));
}

function mapManagedUser(uid: string, data: Record<string, unknown>): ManagedUser {
    return {
        uid,
        role: (data.role as Role) ?? 'patron',
        status: (data.status as AccountStatus) ?? 'active',
        memberType: data.memberType as string | undefined,
        homeLibraryId: data.homeLibraryId as string | undefined,
        assignedLibraryIds: (data.assignedLibraryIds as string[] | undefined) ?? undefined,
        assignedRegion: data.assignedRegion as string | undefined,
    };
}

/** List users (admin/librarian read per rules). Capped for the management list. */
export async function listUsers(max = 100): Promise<ManagedUser[]> {
    const snap = await getDocs(query(collection(db, 'users'), limit(max)));
    return snap.docs.map((d) => mapManagedUser(d.id, d.data()));
}

// ── Inventory writes (direct Firestore; rules enforce role + library scope) ───

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

/** Create a new book (rules require the caller to have scope over libraryId/region). */
export async function createBook(id: string, input: BookInput): Promise<void> {
    await setDoc(doc(db, 'books', id), input);
}

/** Update a book's mutable fields (rules enforce scope over the existing doc). */
export async function updateBook(id: string, changes: Partial<BookInput>): Promise<void> {
    await updateDoc(doc(db, 'books', id), changes);
}

/** Books owned by a specific library (for a librarian's scoped inventory view). */
export async function listBooksByLibrary(libraryId: string, max = 100): Promise<Book[]> {
    const snap = await getDocs(query(collection(db, 'books'), where('libraryId', '==', libraryId), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Book, 'id'>) }));
}

// ── Admin: audit log ──────────────────────────────────────────────────────────

/** Recent audit entries, newest first (admin-only per rules). */
export async function listAuditLog(max = 100): Promise<AuditEntry[]> {
    const snap = await getDocs(query(collection(db, 'auditLog'), orderBy('createdAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditEntry, 'id'>) }));
}
