import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

import { RatingStars, SectionHeader } from '@/src/components/molecules';
import { useBrandColors } from '@/src/theme/brand';

type FeaturedBookSectionProps = {
    title: string;
    author: string;
    description: string;
    coverSource: ImageSourcePropType;
    onBorrow: () => void;
    borrowDisabled?: boolean;
    genre?: string;
    rating?: number;
    reviews?: number;
};

export function FeaturedBookSection({
    title,
    author,
    description,
    coverSource,
    onBorrow,
    borrowDisabled,
    genre = 'Editor’s Pick',
    rating = 4.6,
    reviews = 128,
}: FeaturedBookSectionProps) {
    const theme = useTheme();
    const brand = useBrandColors();

    return (
        <View style={styles.container}>
            <SectionHeader title="Featured eBook" />
            <Surface style={styles.card} elevation={3}>
                <View style={styles.row}>
                    <View style={styles.coverColumn}>
                        <View style={[styles.glow, { backgroundColor: brand.glow }]} />
                        <View style={[styles.coverShadow, { shadowColor: brand.shadow }]}>
                            <Image source={coverSource} style={styles.cover} />
                        </View>
                    </View>

                    <View style={styles.details}>
                        <LinearGradient
                            colors={brand.ctaGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.genreChip}>
                            <Icon source="star-four-points" size={11} color="#FFFFFF" />
                            <Text style={styles.genreChipText}>{genre}</Text>
                        </LinearGradient>
                        <Text variant="titleLarge" style={styles.bookTitle} numberOfLines={2}>
                            {title}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            by {author}
                        </Text>
                        <View style={styles.rating}>
                            <RatingStars rating={rating} reviews={reviews} />
                        </View>
                    </View>
                </View>

                <Text
                    variant="bodySmall"
                    style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={3}>
                    {description}
                </Text>

                <Pressable
                    onPress={onBorrow}
                    disabled={borrowDisabled}
                    style={({ pressed }) => [
                        styles.borrowButton,
                        { opacity: borrowDisabled ? 0.5 : pressed ? 0.9 : 1 },
                    ]}>
                    <LinearGradient
                        colors={brand.ctaGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.borrowGradient}>
                        <Icon source="bookmark-plus-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.borrowLabel}>Borrow Now</Text>
                    </LinearGradient>
                </Pressable>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    card: {
        borderRadius: 24,
        padding: 18,
    },
    row: {
        flexDirection: 'row',
        gap: 20,
    },
    coverColumn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.9,
    },
    coverShadow: {
        borderRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
    cover: {
        width: 120,
        height: 180,
        borderRadius: 14,
    },
    details: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    genreChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginBottom: 2,
    },
    genreChipText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    bookTitle: {
        fontWeight: '800',
    },
    rating: {
        marginTop: 4,
    },
    description: {
        marginTop: 16,
        lineHeight: 20,
    },
    borrowButton: {
        marginTop: 18,
        borderRadius: 16,
        overflow: 'hidden',
    },
    borrowGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
    },
    borrowLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
