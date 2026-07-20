import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

import { useBrandColors } from '@/src/theme/brand';

type RatingStarsProps = {
    /** Rating out of 5. */
    rating: number;
    /** Optional review count shown next to the stars. */
    reviews?: number;
    size?: number;
};

export function RatingStars({ rating, reviews, size = 16 }: RatingStarsProps) {
    const theme = useTheme();
    const brand = useBrandColors();

    return (
        <View style={styles.container}>
            {[0, 1, 2, 3, 4].map((index) => {
                const filled = rating >= index + 1;
                const half = !filled && rating > index;
                return (
                    <Icon
                        key={index}
                        source={filled ? 'star' : half ? 'star-half-full' : 'star-outline'}
                        size={size}
                        color={brand.ratingStar}
                    />
                );
            })}
            <Text variant="bodySmall" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                {rating.toFixed(1)}
                {reviews != null ? ` (${reviews})` : ''}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    label: {
        marginLeft: 6,
    },
});
