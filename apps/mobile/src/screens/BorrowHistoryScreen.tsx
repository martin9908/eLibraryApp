import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';
import { getAllBorrowRecords, getBooksByIds } from '@/src/services/firestore/libraryService';
import type { BorrowEntry } from '@/src/types/library';
import type { RootStackParamList } from '@/src/types/navigation';

function StatusBadge({ returned }: { returned: boolean }) {
    const theme = useTheme();
    return (
        <Chip
            compact
            style={{
                height: 22,
                backgroundColor: returned ? theme.colors.surfaceVariant : theme.colors.primaryContainer,
            }}
            textStyle={{ fontSize: 10 }}>
            {returned ? 'Returned' : 'Active'}
        </Chip>
    );
}

function HistoryItem({ entry }: { entry: BorrowEntry }) {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <View
            style={[styles.item, { borderBottomColor: theme.colors.surfaceVariant }]}>
            <View style={styles.itemTop}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        variant="titleSmall"
                        numberOfLines={2}
                        style={{ color: theme.colors.onSurface }}
                        onPress={() =>
                            navigation.navigate('BookDetail', { bookId: entry.bookId })
                        }>
                        {entry.book?.title ?? entry.bookId}
                    </Text>
                    <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {entry.book?.author ?? ''}
                    </Text>
                </View>
                <StatusBadge returned={entry.returned} />
            </View>
            <View style={styles.itemDates}>
                {entry.borrowedAt && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Borrowed: {entry.borrowedAt.toDate().toLocaleDateString()}
                    </Text>
                )}
                {entry.returned && entry.returnedAt ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 12 }}>
                        Returned: {entry.returnedAt.toDate().toLocaleDateString()}
                    </Text>
                ) : entry.dueDate && !entry.returned ? (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 12 }}>
                        Due: {entry.dueDate.toDate().toLocaleDateString()}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

export default function BorrowHistoryScreen() {
    const { user } = useAuth();
    const theme = useTheme();

    const [entries, setEntries] = useState<BorrowEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const records = await getAllBorrowRecords(user.uid);
            const bookIds = [...new Set(records.map((r) => r.bookId))];
            const bookMap = await getBooksByIds(bookIds);
            setEntries(records.map((r) => ({ ...r, book: bookMap.get(r.bookId) ?? null })));
        } catch {
            setError('Could not load borrow history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void load();
    }, [load]);

    const active = entries.filter((e) => !e.returned);
    const returned = entries.filter((e) => e.returned);

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            edges={['bottom']}>
            {loading ? (
                <View style={styles.centre}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.centre}>
                    <Text style={{ color: theme.colors.error, textAlign: 'center', marginHorizontal: 32 }}>
                        {error}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={[
                        ...(active.length > 0
                            ? [{ type: 'header' as const, label: `Active (${active.length})` }, ...active.map((e) => ({ type: 'item' as const, entry: e }))]
                            : []),
                        ...(returned.length > 0
                            ? [{ type: 'header' as const, label: `Returned (${returned.length})` }, ...returned.map((e) => ({ type: 'item' as const, entry: e }))]
                            : []),
                        ...(entries.length === 0 ? [{ type: 'empty' as const }] : []),
                    ]}
                    keyExtractor={(item, idx) =>
                        item.type === 'item' ? item.entry.id : `${item.type}-${idx}`
                    }
                    renderItem={({ item }) => {
                        if (item.type === 'header') {
                            return (
                                <>
                                    <Text
                                        variant="titleSmall"
                                        style={[
                                            styles.sectionLabel,
                                            { color: theme.colors.onSurfaceVariant },
                                        ]}>
                                        {item.label}
                                    </Text>
                                    <Divider />
                                </>
                            );
                        }
                        if (item.type === 'empty') {
                            return (
                                <View style={styles.centre}>
                                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                        No borrow records yet.
                                    </Text>
                                </View>
                            );
                        }
                        return <HistoryItem entry={item.entry} />;
                    }}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    listContent: { paddingBottom: 24 },
    sectionLabel: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 6,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    item: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    itemTop: { flexDirection: 'row', alignItems: 'flex-start' },
    itemDates: { flexDirection: 'row', marginTop: 6 },
});
