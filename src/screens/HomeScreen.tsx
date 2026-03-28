import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeTemplate } from '@/src/components/templates';
import type { RootStackParamList } from '@/src/types/navigation';

const featuredBook = {
  title: 'The Hobbit',
  author: 'J.R.R. Tolkien',
  description: 'An unforgettable journey through Middle-earth filled with adventure.',
  coverSource: require('../../assets/images/sample_cover.png'),
};

const continueReading = {
  title: "Jojo's Bizarre Adventure: Steel Ball Run Vol. 1",
  progressLabel: 'Page 10 of 20',
  progress: 0.5,
  coverSource: require('../../assets/images/sample_cover.png'),
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <HomeTemplate
      userName="Juan Dela Cruz"
      featuredBook={featuredBook}
      continueReading={continueReading}
      onBrowseEBooks={() => navigation.navigate('Modal')}
      onBrowsePhysicalBooks={() => navigation.navigate('Modal')}
      onBorrowFeaturedBook={() => navigation.navigate('Modal')}
      onContinueReading={() => navigation.navigate('Modal')}
    />
  );
}
