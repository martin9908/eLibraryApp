import { supabase } from '@/src/lib/supabase';
import { rowToLibrary, rowToUserProfile } from '@/src/lib/supabaseMap';
import type { LibraryRow, UserProfileRow } from '@/src/lib/supabaseMap';
import type { Library, LibraryHours, UserProfile } from '@/src/types/library';

const LIBRARIES_TABLE = 'libraries';
const USERS_TABLE = 'users';

export async function getLibraryById(libraryId: string): Promise<Library | null> {
    const { data, error } = await supabase
        .from(LIBRARIES_TABLE)
        .select('*')
        .eq('id', libraryId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToLibrary(data as LibraryRow);
}

/**
 * Reads users.home_library_id then the corresponding branch row.
 * Returns null when the member has not chosen a home library (the dashboard
 * shows a "choose your library" prompt in that case).
 */
export async function getHomeLibrary(userId: string): Promise<Library | null> {
    const { data, error } = await supabase
        .from(USERS_TABLE)
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const homeLibraryId = rowToUserProfile(data as UserProfileRow).homeLibraryId;
    if (!homeLibraryId) return null;
    return getLibraryById(homeLibraryId);
}

/** Reads the member's declared member type (for the greeting). */
export async function getMemberType(userId: string): Promise<UserProfile['memberType']> {
    const { data, error } = await supabase
        .from(USERS_TABLE)
        .select('member_type')
        .eq('id', userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    return (data as Pick<UserProfileRow, 'member_type'>).member_type ?? undefined;
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
