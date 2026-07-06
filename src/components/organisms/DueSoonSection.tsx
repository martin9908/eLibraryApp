import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
import type { DueSoonEntry } from '@/src/types/library';

type DueSoonSectionProps = {
    items: DueSoonEntry[];
    loading: boolean;
    onViewAll?: () => void;
    onSelect?: (bookId: string, title: string) => void;
};

function formatDate(seconds?: number): string {
    if (!seconds) return '';
    return new Date(seconds * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function DueSoonSection({ items, loading, onViewAll, onSelect }: DueSoonSectionProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <SectionHeader
                title="Due Soon"
                actionLabel={items.length > 0 ? 'View all' : undefined}
                onActionPress={items.length > 0 ? onViewAll : undefined}
            />
            <Surface style={styles.card} elevation={2}>
                {loading ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Loading…
                    </Text>
                ) : items.length === 0 ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Nothing due soon. Enjoy your reading!
                    </Text>
                ) : (
                    items.map((item, index) => {
                        const overdue = item.urgency === 'overdue';
                        // Urgency conveyed by icon + text, not color alone (accessibility).
                        const pillColor = overdue ? theme.colors.error : '#B7791F';
                        const pillBg = overdue ? theme.colors.errorContainer : 'rgba(183,121,31,0.12)';
                        return (
                            <Pressable
                                key={item.id}
                                onPress={() => onSelect?.(item.bookId, item.book?.title ?? '')}
                                style={({ pressed }) => [
                                    styles.row,
                                    index > 0 && styles.rowDivider,
                                    { opacity: pressed ? 0.7 : 1, borderTopColor: theme.colors.surfaceVariant },
                                ]}>
                                <View style={styles.info}>
                                    <Text variant="titleSmall" numberOfLines={1} style={styles.title}>
                                        {item.book?.title ?? item.bookId}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Due: {formatDate(item.dueDate?.seconds)}
                                    </Text>
                                </View>
                                <View style={[styles.pill, { backgroundColor: pillBg }]}>
                                    <Icon
                                        source={overdue ? 'alert-circle' : 'clock-outline'}
                                        size={13}
                                        color={pillColor}
                                    />
                                    <Text variant="labelSmall" style={{ color: pillColor, fontWeight: '800' }}>
                                        {item.label}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })
                )}
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    card: {
        borderRadius: 22,
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    rowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    info: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
});
