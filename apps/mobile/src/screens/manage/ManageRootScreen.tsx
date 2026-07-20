import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { useAuth } from '@/src/context/AuthContext';
import { canManageLibrarians } from '@/src/lib/access';

function comingSoon(feature: string) {
    Alert.alert('Coming soon', `${feature} management screen will be added next.`);
}

export default function ManageRootScreen() {
    const { role } = useAuth();

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>
                Management
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
                Choose an area to manage based on your role.
            </Text>

            <Card mode="contained" style={styles.card}>
                <Card.Title title="Inventory" subtitle="Create, update, and remove books" />
                <Card.Actions>
                    <Button mode="contained" onPress={() => comingSoon('Inventory')}>
                        Open
                    </Button>
                </Card.Actions>
            </Card>

            <Card mode="contained" style={styles.card}>
                <Card.Title title="Patrons" subtitle="View and manage patron accounts" />
                <Card.Actions>
                    <Button mode="contained" onPress={() => comingSoon('Patrons')}>
                        Open
                    </Button>
                </Card.Actions>
            </Card>

            {canManageLibrarians(role) ? (
                <Card mode="contained" style={styles.card}>
                    <Card.Title title="Librarians" subtitle="Assign roles and manage scope" />
                    <Card.Actions>
                        <Button mode="contained" onPress={() => comingSoon('Librarians')}>
                            Open
                        </Button>
                    </Card.Actions>
                </Card>
            ) : null}

            <View style={styles.bottomSpace} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        gap: 12,
    },
    title: {
        fontWeight: '800',
    },
    subtitle: {
        opacity: 0.8,
    },
    card: {
        borderRadius: 14,
    },
    bottomSpace: {
        height: 12,
    },
});