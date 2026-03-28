import { ScrollView, StyleSheet } from 'react-native';

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
        coverSource: number;
    };
    continueReading: {
        title: string;
        progressLabel: string;
        progress: number;
        coverSource: number;
    };
    onBrowseEBooks: () => void;
    onBrowsePhysicalBooks: () => void;
    onBorrowFeaturedBook: () => void;
    onContinueReading: () => void;
};

export function HomeTemplate({
    userName,
    featuredBook,
    continueReading,
    onBrowseEBooks,
    onBrowsePhysicalBooks,
    onBorrowFeaturedBook,
    onContinueReading,
}: HomeTemplateProps) {
    return (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <HomeHeader userName={userName} />
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
});
