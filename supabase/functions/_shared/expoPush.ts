// Expo push helper — vendor-neutral port of the push code in
// functions/src/index.ts. Posts directly to the Expo Push HTTP API so no FCM
// server key is needed for Expo-managed apps.

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export type ExpoMessage = {
    to: string;
    title: string;
    body: string;
    data?: Record<string, string>;
};

/** Send a single Expo push notification. Never throws — logs and returns false. */
export async function sendExpoPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
): Promise<boolean> {
    return (await sendExpoPushBatch([{ to: token, title, body, data }])) > 0;
}

/**
 * Send a batch of Expo push notifications in one request (Expo accepts an array
 * of up to 100 messages). Returns the number of messages accepted (best effort).
 */
export async function sendExpoPushBatch(messages: ExpoMessage[]): Promise<number> {
    if (messages.length === 0) return 0;

    const payload = messages.map((m) => ({
        to: m.to,
        sound: 'default' as const,
        title: m.title,
        body: m.body,
        data: m.data ?? {},
    }));

    try {
        const response = await fetch(EXPO_PUSH_ENDPOINT, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            console.error('Expo push send failed', response.status);
            return 0;
        }
        return messages.length;
    } catch (err) {
        console.error('Expo push send threw', err);
        return 0;
    }
}
