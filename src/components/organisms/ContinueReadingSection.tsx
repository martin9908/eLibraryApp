import { Image, StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';

type ContinueReadingSectionProps = {
    title: string;
    progressLabel: string;
    progress: number;
    coverSource: number;
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

    return (
        <View style={styles.container}>
            <SectionHeader title="Continue Reading" actionLabel="Continue" onActionPress={onContinue} />
            <Card mode="contained" style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <Image source={coverSource} style={styles.cover} />
                    <View style={styles.details}>
                        <Text variant="titleMedium">{title}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                            {progressLabel}
                        </Text>
                        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progress} />
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 18,
    },
    card: {
        borderRadius: 18,
        backgroundColor: '#E8DEF8',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    cover: {
        width: 60,
        height: 90,
        borderRadius: 8,
    },
    details: {
        flex: 1,
    },
    progress: {
        marginTop: 12,
        height: 8,
        borderRadius: 999,
        backgroundColor: 'lightgray',
    },
});
