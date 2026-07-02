import { StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from '@/src/components/atoms';

type ModalScreenProps = {
  onGoHome: () => void;
};

export default function ModalScreen({ onGoHome }: ModalScreenProps) {

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>
      <ThemedText
        type="link"
        style={styles.link}
        onPress={() => {
          onGoHome();
        }}>
        Go to home screen
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});