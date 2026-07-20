import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import type { Library, LibraryHours, UserProfile } from '@/src/types/library';

const LIBRARIES_COLLECTION = 'libraries';
const USERS_COLLECTION = 'users';

function mapLibrary(id: string, raw: Partial<Library>): Library {
    return {
        id,
        name: raw.name ?? 'Local Library',
        region: raw.region ?? '',
        hours: raw.hours,
        contact: raw.contact,
    };
}

export async function getLibraryById(libraryId: string): Promise<Library | null> {
    const snapshot = await getDoc(doc(db, LIBRARIES_COLLECTION, libraryId));
    if (!snapshot.exists()) return null;
    return mapLibrary(snapshot.id, snapshot.data() as Partial<Library>);
}

/**
 * Reads users/{uid}.homeLibraryId then the corresponding branch document.
 * Returns null when the member has not chosen a home library (the dashboard
 * shows a "choose your library" prompt in that case).
 */
export async function getHomeLibrary(userId: string): Promise<Library | null> {
    const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userSnapshot.exists()) return null;
    const homeLibraryId = (userSnapshot.data() as UserProfile).homeLibraryId;
    if (!homeLibraryId) return null;
    return getLibraryById(homeLibraryId);
}

/** Reads the member's declared member type (for the greeting). */
export async function getMemberType(userId: string): Promise<UserProfile['memberType']> {
    const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!snapshot.exists()) return undefined;
    return (snapshot.data() as UserProfile).memberType;
}

/** Parse "HH:mm" into minutes-since-midnight; null when malformed. */
function toMinutes(hhmm: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
}

/**
 * Derives whether a library is currently open by comparing the local time to
 * its service hours. Handles overnight ranges (close < open). Returns false
 * when hours are absent or malformed.
 */
export function isOpenNow(library: Library, now: Date = new Date()): boolean {
    const hours: LibraryHours | undefined = library.hours;
    if (!hours) return false;
    const open = toMinutes(hours.open);
    const close = toMinutes(hours.close);
    if (open === null || close === null) return false;
    const current = now.getHours() * 60 + now.getMinutes();
    if (close >= open) return current >= open && current < close;
    return current >= open || current < close;
}
