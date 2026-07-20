import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';
import {
    getAllBorrowRecords,
    getBooksByIds,
    returnBook,
} from '@/src/services/firestore/libraryService';
import type { BorrowEntry } from '@/src/types/library';
import type { RootStackParamList } from '@/src/types/navigation';

function Initials({ name }: { name: string }) {
    const theme = useTheme();
    const letters = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
    return (
        <View
            style={[
                styles.avatar,
                { backgroundColor: theme.colors.primaryContainer },
            ]}>
            <Text
                variant="headlineMedium"
                style={{ color: theme.colors.onPrimaryContainer, fontWeight: '800' }}>
                {letters}
            </Text>
        </View>
    );
}

export default function AccountScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user, signOut } = useAuth();
    const theme = useTheme();

    const [activeBorrows, setActiveBorrows] = useState<BorrowEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [returningId, setReturningId] = useState<string | null>(null);

    const loadActiveBorrows = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const records = await getAllBorrowRecords(user.uid);
            const active = records.filter((r) => !r.returned);
            const bookIds = [...new Set(active.map((r) => r.bookId))];
            const bookMap = await getBooksByIds(bookIds);
            setActiveBorrows(active.map((r) => ({ ...r, book: bookMap.get(r.bookId) ?? null })));
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            void loadActiveBorrows();
        }, [loadActiveBorrows]),
    );

    const handleReturn = useCallback(
        (entry: BorrowEntry) => {
            Alert.alert('Return book?', `Return "${entry.book?.title ?? 'this book'}"?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Return',
                    style: 'destructive',
                    onPress: async () => {
                        setReturningId(entry.id);
                        try {
                            await returnBook(entry.id, entry.bookId);
                            await loadActiveBorrows();
                        } catch {
                            Alert.alert('Error', 'Could not return the book. Please try again.');
                        } finally {
                            setReturningId(null);
                        }
                    },
                },
            ]);
        },
        [loadActiveBorrows],
    );

    const handleSignOut = useCallback(() => {
        Alert.alert('Sign out?', 'You will need to sign in again to access your books.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => void signOut(),
            },
        ]);
    }, [signOut]);

    const displayName = user?.displayName ?? 'Patron';
    const email = user?.email ?? '';

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile header */}
                <View style={styles.profileSection}>
                    <Initials name={displayName} />
                    <Text
                        variant="headlineSmall"
                        style={{ color: theme.colors.onBackground, fontWeight: '800', marginTop: 12 }}>
                        {displayName}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {email}
                    </Text>
                </View>

                <Divider style={styles.divider} />

                {/* Active borrows */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text
                            variant="titleMedium"
                            style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
                            Active Borrows
                        </Text>
                        <Button
                            compact
                            mode="text"
                            onPress={() => navigation.navigate('BorrowHistory')}>
                            See all
                        </Button>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 16 }} />
                    ) : activeBorrows.length === 0 ? (
                        <Text
                            variant="bodyMedium"
                            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                            You have no active borrows.
                        </Text>
                    ) : (
                        activeBorrows.map((entry) => (
                            <Card
                                key={entry.id}
                                style={[styles.borrowCard, { backgroundColor: theme.colors.surface }]}
                                mode="elevated">
                                <Card.Content>
                                    <View style={styles.borrowCardRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text
                                                variant="titleSmall"
                                                numberOfLines={1}
                                                style={{ color: theme.colors.onSurface }}>
                                                {entry.book?.title ?? entry.bookId}
                                            </Text>
                                            <Text
                                                variant="bodySmall"
                                                style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                                {entry.book?.author ?? ''}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                <Chip
                                                    compact
                                                    style={{ backgroundColor: theme.colors.primaryContainer, height: 22 }}
                                                    textStyle={{ fontSize: 10 }}>
                                                    {entry.type === 'ebook' ? 'eBook' : 'Physical'}
                                                </Chip>
                                                {entry.dueDate && (
                                                    <Text
                                                        variant="bodySmall"
                                                        style={{
                                                            color: theme.colors.onSurfaceVariant,
                                                            marginLeft: 8,
                                                        }}>
                                                        Due {entry.dueDate.toDate().toLocaleDateString()}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <Button
                                            mode="outlined"
                                            compact
                                            onPress={() => handleReturn(entry)}
                                            loading={returningId === entry.id}
                                            disabled={returningId !== null}
                                            style={styles.returnButton}>
                                            Return
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                </View>

                <Divider style={styles.divider} />

                {/* Sign out */}
                <View style={styles.section}>
                    <Button
                        mode="outlined"
                        onPress={handleSignOut}
                        icon="logout"
                        textColor={theme.colors.error}
                        style={[styles.signOutButton, { borderColor: theme.colors.error }]}>
                        Sign Out
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 32 },
    profileSection: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: { marginHorizontal: 16, marginVertical: 8 },
    section: { paddingHorizontal: 16, paddingTop: 8 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    borrowCard: { marginBottom: 10, borderRadius: 12 },
    borrowCardRow: { flexDirection: 'row', alignItems: 'center' },
    returnButton: { marginLeft: 8, borderRadius: 8 },
    signOutButton: { borderRadius: 10, marginTop: 8 },
});
