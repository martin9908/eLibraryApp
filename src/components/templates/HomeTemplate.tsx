import { ImageSourcePropType, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import {
    ContinueReadingSection,
    FeaturedBookSection,
    HomeHeader,
    HomeQuickActions,
} from '@/src/components/organisms';

type HomeTemplateProps = {
    userName: string;
    featuredBook: {
        title: string;
        author: string;
        description: string;
        coverSource: ImageSourcePropType;
    };
    continueReading: {
        title: string;
        progressLabel: string;
        progress: number;
        coverSource: ImageSourcePropType;
    };
    onBrowseEBooks: () => void;
    onBrowsePhysicalBooks: () => void;
    onBorrowFeaturedBook: () => void;
    onContinueReading: () => void;
    borrowDisabled?: boolean;
    errorMessage?: string | null;
};

export function HomeTemplate({
    userName,
    featuredBook,
    continueReading,
    onBrowseEBooks,
    onBrowsePhysicalBooks,
    onBorrowFeaturedBook,
    onContinueReading,
    borrowDisabled,
    errorMessage,
}: HomeTemplateProps) {
    return (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <HomeHeader userName={userName} />
            {errorMessage ? (
                <Text variant="bodyMedium" style={styles.errorText}>
                    {errorMessage}
                </Text>
            ) : null}
            <HomeQuickActions
                onBrowseEBooks={onBrowseEBooks}
                onBrowsePhysicalBooks={onBrowsePhysicalBooks}
            />
            <FeaturedBookSection
                title={featuredBook.title}
                author={featuredBook.author}
                description={featuredBook.description}
                coverSource={featuredBook.coverSource}
                onBorrow={onBorrowFeaturedBook}
                borrowDisabled={borrowDisabled}
            />
            <ContinueReadingSection
                title={continueReading.title}
                progressLabel={continueReading.progressLabel}
                progress={continueReading.progress}
                coverSource={continueReading.coverSource}
                onContinue={onContinueReading}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        paddingVertical: 28,
        marginTop: 32,
    },
    errorText: {
        marginBottom: 12,
        color: '#B3261E',
    },
});
