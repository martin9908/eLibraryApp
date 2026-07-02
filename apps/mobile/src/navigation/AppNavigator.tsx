import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Appbar, PaperProvider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ExploreScreen from '@/src/screens/ExploreScreen';
import HomeScreen from '@/src/screens/HomeScreen';
import ModalScreen from '@/src/screens/ModalScreen';
import { getPaperTheme } from '@/src/theme/paperTheme';

type TabName = 'Home' | 'Explore';

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const paperTheme = getPaperTheme(mode);
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Appbar.Header mode="center-aligned">
            <Appbar.Content title="eLibrary" />
          </Appbar.Header>

          <View style={styles.content}>
            {activeTab === 'Home' ? <HomeScreen onOpenModal={showModal} /> : <ExploreScreen />}
          </View>

          <View style={styles.tabBar}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabName)}
              buttons={[
                { value: 'Home', label: 'Home' },
                { value: 'Explore', label: 'Explore' },
              ]}
            />
          </View>

          {isModalVisible ? (
            <View style={styles.modalOverlay}>
              <Pressable style={styles.modalBackdrop} onPress={closeModal} />
              <View style={styles.modalCard}>
                <ModalScreen onGoHome={() => { setActiveTab('Home'); closeModal(); }} />
              </View>
            </View>
          ) : null}
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
  },
});