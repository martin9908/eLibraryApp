import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { HomeTemplate } from '@/src/components/templates';
import { useHomeLibraryData } from '@/src/hooks/useHomeLibraryData';
import type { RootStackParamList } from '@/src/types/navigation';

const CURRENT_USER_ID = 'yBIVzQAZoJZ3Q9jUDcVfWK2rrof2';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { featuredBook, continueReading, loading, error, borrowFeaturedBook } = useHomeLibraryData(CURRENT_USER_ID);

  // The Home hero is a dark gradient, so use light status-bar icons while focused.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );

  const featuredCoverSource = featuredBook?.coverImage
    ? { uri: featuredBook.coverImage }
    : require('../../assets/images/sample_cover.png');

  const continueReadingCoverSource = continueReading?.coverImage
    ? { uri: continueReading.coverImage }
    : require('../../assets/images/SBR_Cover.png');

  const handleBorrowFeaturedBook = async () => {
    try {
      await borrowFeaturedBook();
      Alert.alert('Borrowed', 'You can now open this eBook from Continue Reading.');
    } catch (borrowError) {
      const message = borrowError instanceof Error ? borrowError.message : 'Unable to borrow this eBook right now.';
      Alert.alert('Borrow failed', message);
    }
  };

  const handleContinueReading = () => {
    if (!continueReading) {
      Alert.alert('No active eBook', 'Borrow an eBook first to continue reading.');
      return;
    }

    navigation.navigate('Reader', {
      bookId: continueReading.bookId,
      title: continueReading.title,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <HomeTemplate
      userName="Juan Dela Cruz"
      onSearch={() => navigation.navigate('Modal')}
      featuredBook={{
        title: featuredBook?.title ?? 'No featured eBook yet',
        author: featuredBook?.author ?? 'Library',
        description:
          featuredBook?.availableCopies && featuredBook.availableCopies > 0
            ? `${featuredBook.availableCopies} copies available`
            : 'New eBooks will appear here once added to Firestore.',
        coverSource: featuredCoverSource,
      }}
      continueReading={{
        title: continueReading?.title ?? 'No active book',
        progressLabel: continueReading?.progressLabel ?? 'Borrow a book to start reading',
        progress: continueReading?.progress ?? 0,
        coverSource: continueReadingCoverSource,
      }}
      onBrowseEBooks={() => navigation.navigate('Modal')}
      onBrowsePhysicalBooks={() => navigation.navigate('Modal')}
      onBorrowFeaturedBook={handleBorrowFeaturedBook}
      onContinueReading={handleContinueReading}
      borrowDisabled={!featuredBook || featuredBook.availableCopies <= 0}
      errorMessage={error}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
