'use client';

import type { Session, User as SbUser } from '@supabase/supabase-js';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { supabase } from '@/src/lib/supabase';
import type { LibrarianScope, Role } from '@elibrary/types';

/**
 * App-facing user shape. Kept field-compatible with the previous Firebase
 * `User` (uid / displayName / email) so screens and services need no changes.
 */
export type AuthUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
};

type AuthContextValue = {
    user: AuthUser | null;
    initialising: boolean;
    /** Role from the JWT app_metadata claim (authz source of truth). Defaults 'patron'. */
    role: Role;
    /** Librarian scope from the token (empty for patron/admin). */
    scope: LibrarianScope;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    /** Refresh the session so a just-changed role/scope takes effect. */
    refreshClaims: () => Promise<void>;
};

function toAuthUser(u: SbUser | null): AuthUser | null {
    if (!u) return null;
    const meta = u.user_metadata ?? {};
    return {
        uid: u.id,
        email: u.email ?? null,
        displayName: (meta.display_name as string) ?? (meta.full_name as string) ?? null,
    };
}

/** Read role + scope from the user's app_metadata claims (source of truth for authz). */
function readClaims(u: SbUser | null): { role: Role; scope: LibrarianScope } {
    const claims = (u?.app_metadata ?? {}) as Record<string, unknown>;
    return {
        role: (claims.role as Role | undefined) ?? 'patron',
        scope: {
            assignedLibraryIds: (claims.libs as string[] | undefined) ?? undefined,
            assignedRegion: (claims.region as string | undefined) ?? undefined,
        },
    };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [initialising, setInitialising] = useState(true);
    const [role, setRole] = useState<Role>('patron');
    const [scope, setScope] = useState<LibrarianScope>({});

    const apply = useCallback((session: Session | null) => {
        const sbUser = session?.user ?? null;
        setUser(toAuthUser(sbUser));
        const { role: r, scope: s } = readClaims(sbUser);
        setRole(r);
        setScope(s);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            apply(data.session);
            setInitialising(false);
        });
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            apply(session);
            setInitialising(false);
        });
        return () => data.subscription.unsubscribe();
    }, [apply]);

    const refreshClaims = useCallback(async () => {
        const { data } = await supabase.auth.refreshSession();
        apply(data.session);
    }, [apply]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } },
        });
        if (error) throw error;
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    const value = useMemo(
        () => ({ user, initialising, role, scope, signIn, signUp, signOut, refreshClaims }),
        [user, initialising, role, scope, signIn, signUp, signOut, refreshClaims],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
