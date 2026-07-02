import { ImageSourcePropType, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    CategoriesSection,
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
    onSearch?: () => void;
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
    onSearch,
    borrowDisabled,
    errorMessage,
}: HomeTemplateProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            style={{ backgroundColor: theme.colors.background }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}>
            <HomeHeader userName={userName} insetTop={insets.top} onSearchPress={onSearch} />

            <View style={styles.body}>
                {errorMessage ? (
                    <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
                        {errorMessage}
                    </Text>
                ) : null}

                <HomeQuickActions
                    onBrowseEBooks={onBrowseEBooks}
                    onBrowsePhysicalBooks={onBrowsePhysicalBooks}
                />
                <CategoriesSection onSelect={onBrowseEBooks} />
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
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    errorText: {
        marginBottom: 12,
    },
});
