import { Pressable, StyleSheet } from 'react-native';
import { Icon, Text } from 'react-native-paper';

type LibraryActionButtonProps = {
    label: string;
    backgroundColor: string;
    onPress: () => void;
    icon?: string;
};

export function LibraryActionButton({ label, backgroundColor, onPress, icon }: LibraryActionButtonProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.button, { backgroundColor, opacity: pressed ? 0.85 : 1 }]}
            onPress={onPress}>
            {icon ? <Icon source={icon} size={26} color="#FFF" /> : null}
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
        gap: 6,
    },
    label: {
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 22,
        flexShrink: 1,
    },
});
