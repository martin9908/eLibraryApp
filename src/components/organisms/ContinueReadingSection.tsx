import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { Icon, ProgressBar, Surface, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
import { useBrandColors } from '@/src/theme/brand';

type ContinueReadingSectionProps = {
    title: string;
    progressLabel: string;
    progress: number;
    coverSource: ImageSourcePropType;
    onContinue: () => void;
};

export function ContinueReadingSection({
    title,
    progressLabel,
    progress,
    coverSource,
    onContinue,
}: ContinueReadingSectionProps) {
    const theme = useTheme();
    const brand = useBrandColors();
    const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);

    return (
        <View style={styles.container}>
            <SectionHeader title="Continue Reading" />
            <Surface style={styles.card} elevation={2}>
                <View style={styles.row}>
                    <View style={[styles.coverShadow, { shadowColor: brand.shadow }]}>
                        <Image source={coverSource} style={styles.cover} />
                    </View>
                    <View style={styles.details}>
                        <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                            {title}
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                            {progressLabel}
                        </Text>
                        <View style={styles.progressRow}>
                            <ProgressBar
                                progress={progress}
                                color={theme.colors.primary}
                                style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
                            />
                            <Text
                                variant="labelSmall"
                                style={[styles.percent, { color: theme.colors.primary }]}>
                                {percent}%
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={onContinue}
                        style={({ pressed }) => [styles.playWrap, { opacity: pressed ? 0.85 : 1 }]}>
                        <LinearGradient
                            colors={brand.ctaGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.play}>
                            <Icon source="play" size={24} color="#FFFFFF" />
                        </LinearGradient>
                    </Pressable>
                </View>
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
        gap: 14,
    },
    coverShadow: {
        borderRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    cover: {
        width: 60,
        height: 90,
        borderRadius: 10,
    },
    details: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
    },
    progress: {
        flex: 1,
        height: 8,
        borderRadius: 999,
    },
    percent: {
        fontWeight: '800',
    },
    playWrap: {
        borderRadius: 999,
    },
    play: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
