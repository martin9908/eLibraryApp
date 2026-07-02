import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';
import {
    borrowBook,
    getActiveBorrowRecordForBook,
    getBookById,
    returnBook,
} from '@/src/services/firestore/libraryService';
import type { Book, BorrowRecord } from '@/src/types/library';
import type { RootStackParamList } from '@/src/types/navigation';

type Route = RouteProp<RootStackParamList, 'BookDetail'>;

export default function BookDetailScreen() {
    const route = useRoute<Route>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { bookId } = route.params;
    const { user } = useAuth();
    const theme = useTheme();

    const [book, setBook] = useState<Book | null>(null);
    const [activeRecord, setActiveRecord] = useState<BorrowRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedBook, record] = await Promise.all([
                getBookById(bookId),
                user ? getActiveBorrowRecordForBook(user.uid, bookId) : Promise.resolve(null),
            ]);
            setBook(fetchedBook);
            setActiveRecord(record);
        } finally {
            setLoading(false);
        }
    }, [bookId, user]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleBorrow = useCallback(async () => {
        if (!book || !user) return;
        setActionLoading(true);
        try {
            await borrowBook(user.uid, book);
            await loadData();
        } catch (e) {
            Alert.alert('Borrow failed', e instanceof Error ? e.message : 'Please try again.');
        } finally {
            setActionLoading(false);
        }
    }, [book, user, loadData]);

    const handleReturn = useCallback(async () => {
        if (!activeRecord || !book) return;
        Alert.alert('Return book?', `Return "${book.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Return',
                style: 'destructive',
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await returnBook(activeRecord.id, book.id);
                        await loadData();
                    } catch {
                        Alert.alert('Error', 'Could not return the book. Please try again.');
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    }, [activeRecord, book, loadData]);

    const handleRead = useCallback(() => {
        if (!book) return;
        navigation.navigate('Reader', { bookId: book.id, title: book.title });
    }, [book, navigation]);

    if (loading) {
        return (
            <View style={[styles.centre, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!book) {
        return (
            <View style={[styles.centre, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.error }}>Book not found.</Text>
            </View>
        );
    }

    const isBorrowed = activeRecord !== null;
    const canBorrow = !isBorrowed && book.availableCopies > 0;
    const isEbook = book.type === 'ebook';

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Cover hero */}
                <View style={styles.hero}>
                    {book.coverImage ? (
                        <Image
                            source={{ uri: book.coverImage }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                        />
                    ) : (
                        <View
                            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.primaryContainer }]}
                        />
                    )}
                    <LinearGradient
                        colors={['transparent', theme.colors.background]}
                        style={styles.heroGradient}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Type + category */}
                    <View style={styles.badgesRow}>
                        <Chip compact style={{ backgroundColor: theme.colors.primaryContainer }} textStyle={{ fontSize: 11 }}>
                            {isEbook ? 'eBook' : 'Physical'}
                        </Chip>
                        <Chip compact style={{ backgroundColor: theme.colors.surfaceVariant, marginLeft: 8 }} textStyle={{ fontSize: 11 }}>
                            {book.category}
                        </Chip>
                    </View>

                    {/* Title & author */}
                    <Text
                        variant="headlineMedium"
                        style={{ color: theme.colors.onBackground, fontWeight: '800', marginTop: 8 }}>
                        {book.title}
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {book.author}
                    </Text>

                    <Divider style={{ marginVertical: 16 }} />

                    {/* Availability */}
                    <View style={styles.availabilityRow}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            Copies available:
                        </Text>
                        <Text
                            variant="bodyMedium"
                            style={{
                                color: book.availableCopies > 0 ? theme.colors.secondary : theme.colors.error,
                                fontWeight: '700',
                                marginLeft: 8,
                            }}>
                            {book.availableCopies} / {book.totalCopies}
                        </Text>
                    </View>

                    {isBorrowed && (
                        <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.primary, marginTop: 6, fontWeight: '600' }}>
                            ✓ You have this book borrowed
                            {activeRecord?.dueDate
                                ? ` · Due ${activeRecord.dueDate.toDate().toLocaleDateString()}`
                                : ''}
                        </Text>
                    )}

                    <Divider style={{ marginVertical: 16 }} />

                    {/* Actions */}
                    <View style={styles.actions}>
                        {isBorrowed && isEbook && (
                            <Button
                                mode="contained"
                                onPress={handleRead}
                                style={styles.actionButton}
                                icon="book-open-variant"
                                disabled={actionLoading}>
                                Read Now
                            </Button>
                        )}
                        {isBorrowed && (
                            <Button
                                mode="outlined"
                                onPress={handleReturn}
                                style={styles.actionButton}
                                icon="keyboard-return"
                                loading={actionLoading}
                                disabled={actionLoading}>
                                Return
                            </Button>
                        )}
                        {canBorrow && (
                            <Button
                                mode="contained"
                                onPress={handleBorrow}
                                style={styles.actionButton}
                                icon="bookmark-plus-outline"
                                loading={actionLoading}
                                disabled={actionLoading}>
                                Borrow
                            </Button>
                        )}
                        {!isBorrowed && book.availableCopies === 0 && (
                            <Button
                                mode="outlined"
                                disabled
                                style={styles.actionButton}
                                icon="clock-outline">
                                Currently Unavailable
                            </Button>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { flexGrow: 1 },
    hero: {
        height: 240,
        position: 'relative',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 32,
    },
    badgesRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    availabilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actions: {
        gap: 12,
    },
    actionButton: {
        borderRadius: 10,
    },
});
