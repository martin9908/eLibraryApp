import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
import { dashboardStrings as S } from '@/src/lib/dashboardStrings';

type QuickLink = { key: string; label: string; icon: string };

const LINKS: QuickLink[] = [
    { key: 'reserve', label: S.quickLinks.reserve, icon: 'bookmark-outline' },
    { key: 'rules', label: S.quickLinks.rules, icon: 'clipboard-text-outline' },
    { key: 'guide', label: S.quickLinks.guide, icon: 'book-open-outline' },
    { key: 'contact', label: S.quickLinks.contact, icon: 'email-outline' },
];

type QuickLinksSectionProps = {
    onSelect?: (key: string) => void;
};

export function QuickLinksSection({ onSelect }: QuickLinksSectionProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <SectionHeader title={S.quickLinks.title} />
            <View style={styles.grid}>
                {LINKS.map((link) => (
                    <Pressable
                        key={link.key}
                        accessibilityRole="button"
                        accessibilityLabel={link.label}
                        onPress={() => onSelect?.(link.key)}
                        style={({ pressed }) => [styles.itemWrap, { opacity: pressed ? 0.7 : 1 }]}>
                        <Surface style={styles.item} elevation={1}>
                            <View style={[styles.iconWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
                                <Icon source={link.icon} size={20} color={theme.colors.primary} />
                            </View>
                            <Text variant="labelLarge" style={styles.label} numberOfLines={1}>
                                {link.label}
                            </Text>
                        </Surface>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    itemWrap: {
        // Two per row accounting for the 12px gap.
        width: '47%',
        flexGrow: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 16,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontWeight: '700',
        flexShrink: 1,
    },
});
