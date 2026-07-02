import { useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { type ComponentType, useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Surface, Text, useTheme } from 'react-native-paper';

import { useAuth } from '@/src/context/AuthContext';
import { canUserAccessBook, getBookById } from '@/src/services/firestore/libraryService';
import { useBrandColors } from '@/src/theme/brand';
import type { RootStackParamList } from '@/src/types/navigation';

const isExpoGo = Constants.appOwnership === 'expo';

type PdfComponentProps = {
    source: { uri: string; cache: boolean };
    style: object;
    trustAllCerts: boolean;
    onError: (error: Error) => void;
};

let NativePdf: ComponentType<PdfComponentProps> | null = null;

if (!isExpoGo && Platform.OS !== 'web') {
    try {
        NativePdf = require('react-native-pdf').default as ComponentType<PdfComponentProps>;
    } catch {
        NativePdf = null;
    }
}

type ReaderRoute = {
    key: string;
    name: 'Reader';
    params: RootStackParamList['Reader'];
};

type ReaderStateViewProps = {
    icon: string;
    iconTone: 'brand' | 'error';
    title: string;
    message: string;
    actionLabel: string;
    actionIcon: string;
    onAction: () => void;
};

function ReaderStateView({
    icon,
    iconTone,
    title,
    message,
    actionLabel,
    actionIcon,
    onAction,
}: ReaderStateViewProps) {
    const theme = useTheme();
    const brand = useBrandColors();
    const toneColor = iconTone === 'error' ? theme.colors.error : theme.colors.primary;

    return (
        <View style={styles.container}>
            <Surface style={styles.card} elevation={2}>
                <View style={[styles.iconBadge, { backgroundColor: toneColor + '1A' }]}>
                    <Icon source={icon} size={40} color={toneColor} />
                </View>
                <Text variant="titleLarge" style={styles.stateTitle}>
                    {title}
                </Text>
                <Text
                    variant="bodyMedium"
                    style={[styles.stateMessage, { color: theme.colors.onSurfaceVariant }]}>
                    {message}
                </Text>
                <Pressable
                    onPress={onAction}
                    style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.9 : 1 }]}>
                    <LinearGradient
                        colors={brand.ctaGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionGradient}>
                        <Icon source={actionIcon} size={20} color="#FFFFFF" />
                        <Text style={styles.actionLabel}>{actionLabel}</Text>
                    </LinearGradient>
                </Pressable>
            </Surface>
        </View>
    );
}

const ReaderScreen = () => {
    const route = useRoute<ReaderRoute>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [ebookUrl, setEbookUrl] = useState<string | null>(null);

    const loadReaderData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            const hasAccess = await canUserAccessBook(user!.uid, route.params.bookId);

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
    }, [route.params.bookId, user]);

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
            <ReaderStateView
                icon="lock-outline"
                iconTone="error"
                title={route.params.title}
                message={errorMessage ?? 'This eBook is not currently available.'}
                actionLabel="Try Again"
                actionIcon="refresh"
                onAction={() => void loadReaderData()}
            />
        );
    }

    if (Platform.OS === 'web' || isExpoGo || !NativePdf) {
        return (
            <ReaderStateView
                icon="book-open-page-variant"
                iconTone="brand"
                title={route.params.title}
                message="In-app PDF rendering requires a native development build. In Expo Go and on web, open the PDF in your browser."
                actionLabel="Open PDF"
                actionIcon="open-in-new"
                onAction={() => void Linking.openURL(ebookUrl)}
            />
        );
    }

    return (
        <View style={styles.pdfContainer}>
            <NativePdf
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
        padding: 24,
        justifyContent: 'center',
    },
    card: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
    },
    iconBadge: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    stateTitle: {
        fontWeight: '800',
        textAlign: 'center',
    },
    stateMessage: {
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 21,
    },
    actionButton: {
        marginTop: 24,
        borderRadius: 16,
        overflow: 'hidden',
        alignSelf: 'stretch',
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
    },
    actionLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
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
});