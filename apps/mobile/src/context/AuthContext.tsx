import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
    type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth } from '@/src/lib/firebase';
import {
    clearPushToken,
    registerForPushNotificationsAsync,
    savePushToken,
} from '@/src/services/notificationService';
import type { LibrarianScope, Role } from '@/src/types/library';

type AuthContextValue = {
    user: User | null;
    /** True while Firebase is resolving the initial persisted auth state. */
    initialising: boolean;
    /** Role from the ID token custom claim (authz source of truth). Defaults 'patron'. */
    role: Role;
    /** Librarian scope from the token (empty for patron/admin). */
    scope: LibrarianScope;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    /** Force-refresh the ID token so a just-changed role/scope takes effect. */
    refreshClaims: () => Promise<void>;
};

/** Read role + scope from a user's ID token claims (source of truth for authz). */
async function readClaims(u: User): Promise<{ role: Role; scope: LibrarianScope }> {
    const res = await u.getIdTokenResult();
    const claimRole = res.claims.role as Role | undefined;
    return {
        role: claimRole ?? 'patron',
        scope: {
            assignedLibraryIds: (res.claims.libs as string[] | undefined) ?? undefined,
            assignedRegion: (res.claims.region as string | undefined) ?? undefined,
        },
    };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initialising, setInitialising] = useState(true);
    const [role, setRole] = useState<Role>('patron');
    const [scope, setScope] = useState<LibrarianScope>({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const { role: r, scope: s } = await readClaims(firebaseUser);
                    setRole(r);
                    setScope(s);
                } catch {
                    setRole('patron');
                    setScope({});
                }
            } else {
                setRole('patron');
                setScope({});
            }
            setInitialising(false);
        });
        return unsubscribe;
    }, []);

    const refreshClaims = useCallback(async () => {
        if (!auth.currentUser) return;
        await auth.currentUser.getIdToken(true); // force refresh
        const { role: r, scope: s } = await readClaims(auth.currentUser);
        setRole(r);
        setScope(s);
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Register push token in the background — don't block sign-in.
        registerForPushNotificationsAsync()
            .then((token) => {
                if (token) return savePushToken(credential.user.uid, token);
            })
            .catch(() => { /* non-fatal */ });
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        // Refresh the user so displayName is immediately available.
        setUser({ ...credential.user, displayName });
        // Register push token in the background.
        registerForPushNotificationsAsync()
            .then((token) => {
                if (token) return savePushToken(credential.user.uid, token);
            })
            .catch(() => { /* non-fatal */ });
    }, []);

    const signOut = useCallback(async () => {
        // Best-effort: clear the push token before signing out.
        if (user?.uid) {
            await clearPushToken(user.uid).catch(() => { /* non-fatal */ });
        }
        await firebaseSignOut(auth);
    }, [user]);

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
