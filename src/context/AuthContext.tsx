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

type AuthContextValue = {
    user: User | null;
    /** True while Firebase is resolving the initial persisted auth state. */
    initialising: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initialising, setInitialising] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setInitialising(false);
        });
        return unsubscribe;
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
        () => ({ user, initialising, signIn, signUp, signOut }),
        [user, initialising, signIn, signUp, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
