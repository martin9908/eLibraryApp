import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type HomeHeaderProps = {
    userName: string;
};

export function HomeHeader({ userName }: HomeHeaderProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Text variant="headlineLarge" style={styles.title}>
                Welcome,
            </Text>
            <Text
                variant="titleLarge"
                style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {userName}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontWeight: '700',
    },
    subtitle: {
        paddingTop: 16,
        fontWeight: '600',
    },
});
