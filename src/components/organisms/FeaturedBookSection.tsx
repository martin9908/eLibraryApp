import { Image, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';

type FeaturedBookSectionProps = {
    title: string;
    author: string;
    description: string;
    coverSource: number;
    onBorrow: () => void;
};

export function FeaturedBookSection({
    title,
    author,
    description,
    coverSource,
    onBorrow,
}: FeaturedBookSectionProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <SectionHeader title="Featured eBook" />
            <Card mode="contained" style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <Image source={coverSource} style={styles.cover} />
                    <View style={styles.details}>
                        <Text variant="titleLarge" style={styles.bookTitle}>
                            {title}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {author}
                        </Text>
                        <Text variant="bodySmall" style={styles.description}>
                            {description}
                        </Text>
                        <Button mode="contained" style={styles.borrowButton} onPress={onBorrow}>
                            <Text variant="titleMedium" style={styles.borrowButtonLabel}>
                                Borrow Now
                            </Text>
                        </Button>
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
        backgroundColor: '#E8F1FA',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    cover: {
        width: 120,
        height: 180,
        borderRadius: 12,
    },
    details: {
        flex: 1,
    },
    bookTitle: {
        fontWeight: '700',
    },
    description: {
        marginTop: 10,
        lineHeight: 20,
    },
    borrowButton: {
        marginTop: 20,
        borderRadius: 12,
    },
    borrowButtonLabel: {
        color: '#FFF',
    },
});
