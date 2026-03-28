import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

type LibraryActionButtonProps = {
    label: string;
    backgroundColor: string;
    onPress: () => void;
};

export function LibraryActionButton({ label, backgroundColor, onPress }: LibraryActionButtonProps) {
    return (
        <Pressable style={[styles.button, { backgroundColor }]} onPress={onPress}>
            <Text variant="titleMedium" style={styles.label}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flex: 1,
        borderRadius: 12,
        minHeight: 76,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 22,
        flexShrink: 1,
    },
});
