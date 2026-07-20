import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { db } from '@/src/lib/firebase';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

// Configure how notifications appear while the app is in the foreground.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowList: true,
    }),
});

/**
 * Request permission and obtain the Expo push token for this device.
 * Returns null on simulators, web, or when permission is denied.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Push notifications require a physical device.
    if (!Device.isDevice) return null;
    // Not supported on web.
    if (Platform.OS === 'web') return null;

    // The expo-notifications PermissionResponse type isn't fully resolved by
    // the TypeScript compiler due to an unresolved 'expo' re-export chain;
    // cast to access the runtime 'status' string field safely.
    type PermsShape = { status: string; canAskAgain: boolean };
    let { status } = (await Notifications.getPermissionsAsync()) as unknown as PermsShape;

    if (status !== 'granted') {
        ({ status } = (await Notifications.requestPermissionsAsync()) as unknown as PermsShape);
    }

    if (status !== 'granted') return null;

    // Android requires an explicit notification channel.
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('elibrary', {
            name: 'eLibrary',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366F1',
        });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
}

/**
 * Persist the Expo push token to Firestore so Cloud Functions can use it.
 * Upserts `users/{userId}` with the token and updatedAt timestamp.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(
        userRef,
        { expoPushToken: token, updatedAt: serverTimestamp() },
        { merge: true },
    );
}

/**
 * Clear the push token from Firestore on sign-out so the user stops receiving
 * notifications for this device session.
 */
export async function clearPushToken(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { expoPushToken: null, updatedAt: serverTimestamp() });
}
