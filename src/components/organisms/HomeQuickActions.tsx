import { StyleSheet, View } from 'react-native';

import { QuickActionCard } from '@/src/components/molecules';
import { useBrandColors } from '@/src/theme/brand';

type HomeQuickActionsProps = {
    onBrowseEBooks: () => void;
    onBrowsePhysicalBooks: () => void;
};

export function HomeQuickActions({ onBrowseEBooks, onBrowsePhysicalBooks }: HomeQuickActionsProps) {
    const brand = useBrandColors();

    return (
        <View style={styles.container}>
            <QuickActionCard
                title="eBooks"
                subtitle="Read instantly"
                icon="book-open-variant"
                gradient={brand.accentGradient}
                onPress={onBrowseEBooks}
            />
            <QuickActionCard
                title="Physical Books"
                subtitle="Reserve & pick up"
                icon="bookshelf"
                gradient={brand.accentGradientAlt}
                onPress={onBrowsePhysicalBooks}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 28,
    },
});
