import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

type FirebaseConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
};

function getRequiredEnv(name: string, value: string | undefined): string {

    if (!value) {
        throw new Error(`Missing required Firebase environment variable: ${name}`);
    }

    return value;
}

function getFirebaseConfig(): FirebaseConfig {
    return {
        apiKey: getRequiredEnv('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
        authDomain: getRequiredEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
        projectId: getRequiredEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
        storageBucket: getRequiredEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
        messagingSenderId: getRequiredEnv(
            'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
            process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        ),
        appId: getRequiredEnv('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
    };
}

const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
