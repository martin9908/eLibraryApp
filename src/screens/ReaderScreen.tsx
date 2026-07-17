import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Surface, Text, useTheme } from 'react-native-paper';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useAuth } from '@/src/context/AuthContext';
import { resolveEbookSource } from '@/src/lib/ebookSource';
import { canUserAccessBook, getBookById } from '@/src/services/firestore/libraryService';
import { saveReadingProgress } from '@/src/services/firestore/readingProgressService';
import { buildPdfViewerHtml, originOf } from '@/src/screens/reader/pdfViewerHtml';
import { useBrandColors } from '@/src/theme/brand';
import type { RootStackParamList } from '@/src/types/navigation';

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
    const theme = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [ebookUrl, setEbookUrl] = useState<string | null>(null);
    const [rendering, setRendering] = useState(true);
    const [renderError, setRenderError] = useState<string | null>(null);

    const loadReaderData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            setRenderError(null);
            setRendering(true);
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

    const source = useMemo(() => (ebookUrl ? resolveEbookSource(ebookUrl) : null), [ebookUrl]);
    const html = useMemo(
        () => (source?.kind === 'pdf' ? buildPdfViewerHtml(source.url) : ''),
        [source],
    );

    const onMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data) as {
                type: string; message?: string; page?: number; pages?: number;
            };
            if (data.type === 'loaded') setRendering(false);
            else if (data.type === 'error') {
                setRendering(false);
                setRenderError(data.message ?? 'This eBook could not be displayed.');
            } else if (data.type === 'progress' && user && data.page && data.pages) {
                // Persist reading position (owner-only) so Continue Reading is real.
                void saveReadingProgress(user.uid, route.params.bookId, data.page, data.pages);
            }
        } catch {
            // ignore malformed messages
        }
    }, [user, route.params.bookId]);

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

    if (renderError) {
        return (
            <ReaderStateView
                icon="file-alert-outline"
                iconTone="error"
                title={route.params.title}
                message={renderError}
                actionLabel="Open in Browser"
                actionIcon="open-in-new"
                onAction={() => void Linking.openURL(ebookUrl)}
            />
        );
    }

    return (
        <View style={styles.pdfContainer}>
            <WebView
                originWhitelist={['*']}
                source={
                    source?.kind === 'drive'
                        ? { uri: source.embedUrl }
                        : { html, baseUrl: originOf(ebookUrl) }
                }
                style={styles.pdf}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState={false}
                allowFileAccess
                onMessage={onMessage}
                onLoadEnd={() => {
                    // Drive's embedded viewer can't postMessage back; clear the
                    // overlay once its page finishes loading.
                    if (source?.kind === 'drive') setRendering(false);
                }}
                onError={() => {
                    setRendering(false);
                    setRenderError('The reader failed to load. Check your connection and try again.');
                }}
            />
            {rendering && (
                <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
                    <ActivityIndicator size="large" />
                    <Text variant="bodyMedium" style={styles.stateText}>
                        Preparing pages…
                    </Text>
                </View>
            )}
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
        backgroundColor: '#0C1B3A',
    },
    pdf: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#0C1B3A',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
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
