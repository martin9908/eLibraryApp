import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

type SectionHeaderProps = {
    title: string;
    actionLabel?: string;
    onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={styles.title}>
                {title}
            </Text>
            {actionLabel && onActionPress ? (
                <Button mode="text" onPress={onActionPress} compact>
                    <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                        {actionLabel}
                    </Text>
                </Button>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        marginBottom: 12,
        fontWeight: '700',
    },
});
