import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, Searchbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/src/components/molecules/BookCard';
import { getAllBooks } from '@/src/services/firestore/libraryService';
import type { Book } from '@/src/types/library';
import type { RootStackParamList } from '@/src/types/navigation';

type Filter = 'all' | 'ebook' | 'physical';

const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'eBooks', value: 'ebook' },
    { label: 'Physical', value: 'physical' },
];

export default function CatalogScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const theme = useTheme();

    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<Filter>('all');

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const type = activeFilter === 'all' ? undefined : activeFilter;
            const result = await getAllBooks({ type });
            setBooks(result);
        } catch (e) {
            setError('Unable to load books. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        void fetchBooks();
    }, [fetchBooks]);

    // Re-fetch when screen comes into focus (e.g., after borrowing/returning)
    useFocusEffect(
        useCallback(() => {
            void fetchBooks();
        }, [fetchBooks]),
    );

    const filteredBooks = useMemo(() => {
        if (!searchQuery.trim()) return books;
        const q = searchQuery.toLowerCase();
        return books.filter(
            (b) =>
                b.title.toLowerCase().includes(q) ||
                b.author.toLowerCase().includes(q) ||
                b.category.toLowerCase().includes(q),
        );
    }, [books, searchQuery]);

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: '800' }}>
                    Catalog
                </Text>
            </View>

            {/* Search */}
            <Searchbar
                placeholder="Search titles, authors…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
                inputStyle={{ color: theme.colors.onSurface }}
                iconColor={theme.colors.onSurfaceVariant}
                elevation={0}
            />

            {/* Type filter chips */}
            <View style={styles.filtersRow}>
                {FILTERS.map((f) => (
                    <Chip
                        key={f.value}
                        selected={activeFilter === f.value}
                        onPress={() => setActiveFilter(f.value)}
                        style={[
                            styles.filterChip,
                            activeFilter === f.value && { backgroundColor: theme.colors.primaryContainer },
                        ]}
                        textStyle={
                            activeFilter === f.value
                                ? { color: theme.colors.onPrimaryContainer, fontWeight: '700' }
                                : { color: theme.colors.onSurfaceVariant }
                        }>
                        {f.label}
                    </Chip>
                ))}
            </View>

            {/* Content */}
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
                    data={filteredBooks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookCard
                            book={item}
                            onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centre}>
                            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                                No books found.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    searchbar: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
    },
    filtersRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    filterChip: {
        borderRadius: 20,
    },
    listContent: {
        paddingTop: 4,
        paddingBottom: 24,
    },
    centre: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
});
