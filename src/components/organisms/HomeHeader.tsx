import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Icon, Text } from 'react-native-paper';

import { useBrandColors } from '@/src/theme/brand';
import type { MemberType } from '@/src/types/library';

type HomeHeaderProps = {
    userName: string;
    memberType?: MemberType;
    unreadCount?: number;
    insetTop: number;
    onSearchPress?: () => void;
    onNotificationsPress?: () => void;
};

function greetingForNow(): { text: string; emoji: string } {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (hour < 18) return { text: 'Good afternoon', emoji: '📖' };
    return { text: 'Good evening', emoji: '🌙' };
}

function initialsFor(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function HomeHeader({
    userName,
    memberType,
    unreadCount = 0,
    insetTop,
    onSearchPress,
    onNotificationsPress,
}: HomeHeaderProps) {
    const brand = useBrandColors();
    const greeting = greetingForNow();

    return (
        <LinearGradient
            colors={brand.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insetTop + 20 }]}>
            {/* Decorative layers for depth */}
            <View style={[styles.decorCircleLg, { backgroundColor: brand.heroDecor }]} />
            <View style={[styles.decorCircleSm, { backgroundColor: brand.heroDecor }]} />

            <View style={styles.topRow}>
                <View style={styles.greetingBlock}>
                    <View style={[styles.eyebrowPill, { backgroundColor: brand.heroField }]}>
                        <Icon source="book-open-page-variant" size={13} color={brand.heroText} />
                        <Text variant="labelSmall" style={[styles.eyebrow, { color: brand.heroText }]}>
                            {memberType ? `NATIONAL LIBRARY · ${memberType.toUpperCase()}` : 'NATIONAL LIBRARY'}
                        </Text>
                    </View>
                    <Text variant="bodyLarge" style={{ color: brand.heroSubtext }}>
                        {greeting.text}, {greeting.emoji}
                    </Text>
                    <Text variant="headlineMedium" style={[styles.name, { color: brand.heroText }]}>
                        {userName}
                    </Text>
                </View>

                <View style={styles.actionsCol}>
                    <Pressable
                        onPress={onNotificationsPress}
                        accessibilityRole="button"
                        accessibilityLabel={
                            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
                        }
                        style={({ pressed }) => [
                            styles.bell,
                            { backgroundColor: brand.heroField, opacity: pressed ? 0.75 : 1 },
                        ]}>
                        <Icon source="bell-outline" size={20} color={brand.heroText} />
                        {unreadCount > 0 ? (
                            <View style={styles.bellBadge}>
                                <Text style={styles.bellBadgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        ) : null}
                    </Pressable>
                    <Avatar.Text
                        size={48}
                        label={initialsFor(userName)}
                        style={{ backgroundColor: brand.heroField }}
                        labelStyle={[styles.avatarLabel, { color: brand.heroText }]}
                    />
                </View>
            </View>

            <Pressable
                onPress={onSearchPress}
                style={({ pressed }) => [
                    styles.search,
                    { backgroundColor: brand.heroField, opacity: pressed ? 0.85 : 1 },
                ]}>
                <Icon source="magnify" size={22} color={brand.heroFieldText} />
                <Text variant="bodyMedium" style={{ color: brand.heroFieldText, flex: 1 }}>
                    Search titles, authors, subjects
                </Text>
                <View style={[styles.searchAdorn, { backgroundColor: brand.heroDecor }]}>
                    <Icon source="tune-variant" size={16} color={brand.heroText} />
                </View>
            </Pressable>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    hero: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    decorCircleLg: {
        position: 'absolute',
        top: -70,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    decorCircleSm: {
        position: 'absolute',
        bottom: -30,
        left: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    greetingBlock: {
        flex: 1,
        gap: 4,
    },
    eyebrowPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        marginBottom: 10,
    },
    eyebrow: {
        letterSpacing: 1.5,
        fontWeight: '800',
    },
    name: {
        fontWeight: '800',
    },
    actionsCol: {
        alignItems: 'center',
        gap: 10,
    },
    bell: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 3,
        borderRadius: 8,
        backgroundColor: '#FF5252',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        lineHeight: 14,
    },
    avatarLabel: {
        fontWeight: '700',
    },
    search: {
        marginTop: 22,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingLeft: 16,
        paddingRight: 8,
        borderRadius: 16,
    },
    searchAdorn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
