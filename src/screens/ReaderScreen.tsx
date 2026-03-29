import { useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import Pdf from 'react-native-pdf';

import { canUserAccessBook, getBookById } from '@/src/services/firestore/libraryService';
import type { RootStackParamList } from '@/src/types/navigation';

const CURRENT_USER_ID = 'yBIVzQAZoJZ3Q9jUDcVfWK2rrof2';

type ReaderRoute = {
    key: string;
    name: 'Reader';
    params: RootStackParamList['Reader'];
};

const ReaderScreen = () => {
    const route = useRoute<ReaderRoute>();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [ebookUrl, setEbookUrl] = useState<string | null>(null);

    const loadReaderData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            const hasAccess = await canUserAccessBook(CURRENT_USER_ID, route.params.bookId);

            if (!hasAccess) {
                setEbookUrl(null);
                setErrorMessage('Access denied. Borrow this eBook first before opening it.');
                return;
            }

            const book = await getBookById(route.params.bookId);

            if (!book?.ebookUrl) {
                setEbookUrl(null);
                setErrorMessage('No eBook URL was found for this title.');
                return;
            }

            setEbookUrl(book.ebookUrl);
        } catch (openError) {
            const message = openError instanceof Error ? openError.message : 'Unable to open this eBook right now.';
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    }, [route.params.bookId]);

    useEffect(() => {
        void loadReaderData();
    }, [loadReaderData]);

    if (loading) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="large" />
                <Text variant="bodyMedium" style={styles.stateText}>
                    Loading your eBook...
                </Text>
            </View>
        );
    }

    if (!ebookUrl) {
        return (
            <View style={styles.container}>
                <Card mode="contained" style={styles.card}>
                    <Card.Title title={route.params.title} subtitle="Reader unavailable" />
                    <Card.Content>
                        <Text variant="bodyMedium" style={styles.text}>
                            {errorMessage ?? 'This eBook is not currently available.'}
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={() => void loadReaderData()}>
                            Retry
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <Card mode="contained" style={styles.card}>
                    <Card.Title title={route.params.title} subtitle="Web fallback" />
                    <Card.Content>
                        <Text variant="bodyMedium" style={styles.text}>
                            In-app PDF rendering is configured for native builds. Open this file in a browser tab for web.
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={() => void Linking.openURL(ebookUrl)}>
                            Open PDF
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        );
    }

    return (
        <View style={styles.pdfContainer}>
            <Pdf
                source={{ uri: ebookUrl, cache: true }}
                style={styles.pdf}
                trustAllCerts={false}
                onError={(error) => {
                    setErrorMessage(error.message);
                }}
            />
        </View>
    );
};

export default ReaderScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    card: {
        borderRadius: 16,
    },
    pdfContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    pdf: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    stateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    stateText: {
        textAlign: 'center',
    },
    text: {
        marginTop: 8,
        lineHeight: 20,
    },
});