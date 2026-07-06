import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Next.js 15 Turbopack passes --localstorage-file to Node.js v25 without a
// valid path.  That leaves a global `localStorage` whose methods throw when
// called (even though `typeof localStorage.getItem === 'function'`).
// Detect this by actually calling getItem; if it throws, replace the global
// with a safe no-op so Firebase's availability check passes cleanly.
try {
    localStorage.getItem('');
} catch {
    (globalThis as unknown as Record<string, unknown>).localStorage = {
        length: 0,
        getItem: (): null => null,
        setItem: (): void => { },
        removeItem: (): void => { },
        clear: (): void => { },
        key: (): null => null,
    };
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
