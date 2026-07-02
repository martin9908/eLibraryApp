import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

type QuickActionCardProps = {
    title: string;
    subtitle: string;
    icon: string;
    /** Gradient stops for the icon tile. */
    gradient: readonly [string, string, ...string[]];
    onPress: () => void;
};

export function QuickActionCard({ title, subtitle, icon, gradient, onPress }: QuickActionCardProps) {
    const theme = useTheme();

    return (
        <Pressable
            style={({ pressed }) => [styles.pressable, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            onPress={onPress}>
            <Surface style={styles.card} elevation={2}>
                <View style={styles.topRow}>
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconWrap}>
                        <Icon source={icon} size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={[styles.chevron, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Icon source="arrow-top-right" size={16} color={theme.colors.onSurfaceVariant} />
                    </View>
                </View>
                <Text variant="titleMedium" style={styles.title}>
                    {title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {subtitle}
                </Text>
            </Surface>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        flex: 1,
    },
    card: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevron: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontWeight: '700',
    },
});
