import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';

import type { Book } from '@/src/types/library';

type Props = {
    book: Book;
    onPress: () => void;
};

export function BookCard({ book, onPress }: Props) {
    const theme = useTheme();

    return (
        <Card style={styles.card} onPress={onPress} mode="elevated">
            <View style={styles.row}>
                {book.coverImage ? (
                    <Image
                        source={{ uri: book.coverImage }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View
                        style={[styles.cover, styles.coverFallback, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text style={[styles.coverFallbackText, { color: theme.colors.onSurfaceVariant }]}>
                            {book.title.slice(0, 2).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text
                        variant="titleSmall"
                        numberOfLines={2}
                        style={{ color: theme.colors.onSurface }}>
                        {book.title}
                    </Text>
                    <Text
                        variant="bodySmall"
                        numberOfLines={1}
                        style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {book.author}
                    </Text>
                    <View style={styles.badges}>
                        <Chip
                            compact
                            style={[
                                styles.badge,
                                {
                                    backgroundColor:
                                        book.type === 'ebook'
                                            ? theme.colors.primaryContainer
                                            : theme.colors.secondaryContainer,
                                },
                            ]}
                            textStyle={{ fontSize: 10 }}>
                            {book.type === 'ebook' ? 'eBook' : 'Physical'}
                        </Chip>
                        <Text
                            variant="bodySmall"
                            style={{
                                color:
                                    book.availableCopies > 0
                                        ? theme.colors.secondary
                                        : theme.colors.error,
                                marginLeft: 6,
                                alignSelf: 'center',
                            }}>
                            {book.availableCopies > 0
                                ? `${book.availableCopies} available`
                                : 'Unavailable'}
                        </Text>
                    </View>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 5,
    },
    row: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    cover: {
        width: 60,
        height: 84,
        borderRadius: 6,
        marginRight: 12,
    },
    coverFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverFallbackText: {
        fontSize: 20,
        fontWeight: '700',
    },
    info: {
        flex: 1,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    badge: {
        height: 22,
    },
});
