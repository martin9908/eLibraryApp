import { ImageSourcePropType, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    CategoriesSection,
    ContinueReadingSection,
    DueSoonSection,
    FeaturedBookSection,
    HomeHeader,
    HomeQuickActions,
    LibraryHoursSection,
    NotificationsSection,
    QuickLinksSection,
} from '@/src/components/organisms';
import type { AppNotification, DueSoonEntry, Library, MemberType } from '@/src/types/library';

type HomeTemplateProps = {
    userName: string;
    memberType: MemberType;
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
    onNotificationsPress?: () => void;
    borrowDisabled?: boolean;
    errorMessage?: string | null;
    // Dashboard panels
    unreadCount: number;
    notifications: AppNotification[];
    notificationsLoading: boolean;
    onMarkAllRead: () => void;
    onMarkOneRead: (id: string) => void;
    dueSoon: DueSoonEntry[];
    dueSoonLoading: boolean;
    onDueSoonSelect?: (bookId: string, title: string) => void;
    onViewAllDueSoon?: () => void;
    homeLibrary: Library | null;
    homeLibraryLoading: boolean;
    onChooseLibrary?: () => void;
    onQuickLink?: (key: string) => void;
};

export function HomeTemplate({
    userName,
    memberType,
    featuredBook,
    continueReading,
    onBrowseEBooks,
    onBrowsePhysicalBooks,
    onBorrowFeaturedBook,
    onContinueReading,
    onSearch,
    onNotificationsPress,
    borrowDisabled,
    errorMessage,
    unreadCount,
    notifications,
    notificationsLoading,
    onMarkAllRead,
    onMarkOneRead,
    dueSoon,
    dueSoonLoading,
    onDueSoonSelect,
    onViewAllDueSoon,
    homeLibrary,
    homeLibraryLoading,
    onChooseLibrary,
    onQuickLink,
}: HomeTemplateProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            style={{ backgroundColor: theme.colors.background }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}>
            <HomeHeader
                userName={userName}
                memberType={memberType}
                unreadCount={unreadCount}
                insetTop={insets.top}
                onSearchPress={onSearch}
                onNotificationsPress={onNotificationsPress}
            />

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
                <DueSoonSection
                    items={dueSoon}
                    loading={dueSoonLoading}
                    onViewAll={onViewAllDueSoon}
                    onSelect={onDueSoonSelect}
                />
                <NotificationsSection
                    items={notifications}
                    unread={unreadCount}
                    loading={notificationsLoading}
                    onMarkAll={onMarkAllRead}
                    onMarkOne={onMarkOneRead}
                />
                <LibraryHoursSection
                    library={homeLibrary}
                    loading={homeLibraryLoading}
                    onChooseLibrary={onChooseLibrary}
                />
                <CategoriesSection onSelect={onBrowseEBooks} />
                <QuickLinksSection onSelect={onQuickLink} />
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
