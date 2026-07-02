import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Text, useTheme } from 'react-native-paper';

import { SafeAreaView } from 'react-native-safe-area-context';

type HomeScreenProps = {
  onOpenModal: () => void;
};

export default function HomeScreen({ onOpenModal }: HomeScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome,
          </Text>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurfaceVariant, paddingTop: 16, fontWeight: "600" }}>
            Juan Dela Cruz
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="contained"
            style={styles.actionButton}
            buttonColor={theme.colors.secondary}
            onPress={onOpenModal}>
            Browse eBooks
          </Button>
          <Button mode="contained" style={styles.actionButton} onPress={onOpenModal}>
            Browse Physical Books
          </Button>
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Featured eBook
        </Text>
        <Card mode="contained" style={[styles.featuredCard, { backgroundColor: '#E8F1FA' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.featuredBookTitle}>
              The Hobbit
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              J.R.R. Tolkien
            </Text>
            <Text variant="bodySmall" style={styles.featuredDescription}>
              An unforgettable journey through Middle-earth filled with adventure.
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Continue Reading
        </Text>
        <Card mode="contained" style={styles.continueCard}>
          <Card.Content>
            <Text variant="titleMedium">The Hobbit</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Chapter 6 of 19
            </Text>
            <ProgressBar progress={0.32} color={theme.colors.primary} style={styles.progress} />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '700',
  },
  featuredCard: {
    borderRadius: 18,
    marginBottom: 24,
  },
  featuredBookTitle: {
    fontWeight: '700',
  },
  featuredDescription: {
    marginTop: 10,
    lineHeight: 20,
  },
  continueCard: {
    borderRadius: 18,
  },
  progress: {
    marginTop: 12,
    height: 8,
    borderRadius: 999,
  },
});