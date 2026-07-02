import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
import { useBrandColors } from '@/src/theme/brand';

const CATEGORIES = [
    'All',
    'Filipiniana',
    'Fiction',
    'Science',
    'History',
    'Children',
    'Reference',
];

type CategoriesSectionProps = {
    onSelect?: (category: string) => void;
};

export function CategoriesSection({ onSelect }: CategoriesSectionProps) {
    const [selected, setSelected] = useState('All');
    const theme = useTheme();
    const brand = useBrandColors();

    return (
        <>
            <SectionHeader title="Browse by Category" />
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
                style={styles.scroll}>
                {CATEGORIES.map((category, index) => {
                    const color = brand.categoryPalette[index % brand.categoryPalette.length];
                    const isSelected = selected === category;
                    return (
                        <Pressable
                            key={category}
                            onPress={() => {
                                setSelected(category);
                                onSelect?.(category);
                            }}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isSelected ? color : theme.colors.surface,
                                    borderColor: isSelected ? color : theme.colors.outlineVariant,
                                },
                            ]}>
                            <Text
                                variant="labelLarge"
                                style={{
                                    color: isSelected ? '#FFFFFF' : theme.colors.onSurfaceVariant,
                                    fontWeight: '700',
                                }}>
                                {category}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    scroll: {
        marginHorizontal: -20,
        marginBottom: 28,
    },
    row: {
        gap: 10,
        paddingVertical: 2,
        paddingHorizontal: 20,
    },
    chip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1.5,
    },
});
