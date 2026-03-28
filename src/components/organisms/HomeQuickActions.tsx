import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { LibraryActionButton } from '@/src/components/molecules';

type HomeQuickActionsProps = {
    onBrowseEBooks: () => void;
    onBrowsePhysicalBooks: () => void;
};

export function HomeQuickActions({ onBrowseEBooks, onBrowsePhysicalBooks }: HomeQuickActionsProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <LibraryActionButton
                label="Browse eBooks"
                backgroundColor={theme.colors.secondary}
                onPress={onBrowseEBooks}
            />
            <LibraryActionButton
                label="Browse Physical Books"
                backgroundColor={theme.colors.primary}
                onPress={onBrowsePhysicalBooks}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        backgroundColor: '#FFF',
        padding: 16,
        minHeight: 110,
        alignContent: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },
});
