import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

type SectionHeaderProps = {
    title: string;
    actionLabel?: string;
    onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <View style={[styles.accent, { backgroundColor: theme.colors.primary }]} />
                <Text variant="titleLarge" style={styles.title}>
                    {title}
                </Text>
            </View>
            {actionLabel && onActionPress ? (
                <Pressable
                    onPress={onActionPress}
                    style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
                    <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                        {actionLabel}
                    </Text>
                    <Icon source="chevron-right" size={18} color={theme.colors.primary} />
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    accent: {
        width: 4,
        height: 20,
        borderRadius: 999,
    },
    title: {
        fontWeight: '800',
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
