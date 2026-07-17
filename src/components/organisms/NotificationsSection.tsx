import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import type { AppNotification, NotificationCategory } from '@/src/types/library';

const CATEGORY_ICON: Record<NotificationCategory, string> = {
    availability: 'book-plus',
    dueReminder: 'clock-alert-outline',
    returnConfirm: 'check-circle-outline',
    general: 'bell-outline',
};

function timeAgo(seconds?: number): string {
    if (!seconds) return '';
    const diff = Date.now() - seconds * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

type NotificationsSectionProps = {
    items: AppNotification[];
    unread: number;
    loading: boolean;
    onMarkAll: () => void;
    onMarkOne: (id: string) => void;
};

export function NotificationsSection({
    items,
    unread,
    loading,
    onMarkAll,
    onMarkOne,
}: NotificationsSectionProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <SectionHeader
                title={S.notifications.title}
                actionLabel={unread > 0 ? S.notifications.markAll : undefined}
                onActionPress={unread > 0 ? onMarkAll : undefined}
            />
            <Surface style={styles.card} elevation={2}>
                {loading ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {S.notifications.loading}
                    </Text>
                ) : items.length === 0 ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {S.notifications.empty}
                    </Text>
                ) : (
                    items.map((n, index) => (
                        <Pressable
                            key={n.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${n.read ? '' : 'Unread: '}${n.title}`}
                            onPress={() => !n.read && onMarkOne(n.id)}
                            style={({ pressed }) => [
                                styles.row,
                                index > 0 && styles.rowDivider,
                                { borderTopColor: theme.colors.surfaceVariant, opacity: pressed ? 0.7 : 1 },
                                !n.read && { backgroundColor: theme.colors.surfaceVariant, borderRadius: 12 },
                            ]}>
                            <View
                                style={[
                                    styles.iconWrap,
                                    { backgroundColor: theme.colors.surfaceVariant },
                                ]}>
                                <Icon source={CATEGORY_ICON[n.category]} size={18} color={theme.colors.primary} />
                            </View>
                            <View style={styles.info}>
                                <Text variant="titleSmall" style={styles.title} numberOfLines={1}>
                                    {n.title}
                                </Text>
                                {n.body ? (
                                    <Text
                                        variant="bodySmall"
                                        numberOfLines={2}
                                        style={{ color: theme.colors.onSurfaceVariant }}>
                                        {n.body}
                                    </Text>
                                ) : null}
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                    {timeAgo(n.createdAt?.seconds)}
                                </Text>
                            </View>
                            {!n.read ? <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} /> : null}
                        </Pressable>
                    ))
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
        padding: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 10,
    },
    rowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginTop: 6,
    },
});
