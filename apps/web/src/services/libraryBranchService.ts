import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/src/lib/firebase';
import type { Library, LibraryHours, UserProfile } from '@elibrary/types';

const LIBRARIES = 'libraries';
const USERS = 'users';

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
    const snap = await getDoc(doc(db, LIBRARIES, libraryId));
    if (!snap.exists()) return null;
    return mapLibrary(snap.id, snap.data() as Partial<Library>);
}

/**
 * Reads the member's users/{uid}.homeLibraryId then the corresponding branch
 * document. Returns null when the member has not chosen a home library (the
 * dashboard shows a "choose your library" prompt in that case).
 */
export async function getHomeLibrary(userId: string): Promise<Library | null> {
    const userSnap = await getDoc(doc(db, USERS, userId));
    if (!userSnap.exists()) return null;
    const homeLibraryId = (userSnap.data() as UserProfile).homeLibraryId;
    if (!homeLibraryId) return null;
    return getLibraryById(homeLibraryId);
}

/** Parse "HH:mm" into minutes-since-midnight; null when malformed. */
function toMinutes(hhmm: string): number | null {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
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
    const cur = now.getHours() * 60 + now.getMinutes();
    // Same-day range.
    if (close >= open) return cur >= open && cur < close;
    // Overnight range (e.g. 20:00–02:00).
    return cur >= open || cur < close;
}
