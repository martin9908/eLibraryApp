import { StyleSheet, View } from 'react-native';
import { Button, Icon, Surface, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
import { dashboardStrings as S } from '@/src/lib/dashboardStrings';
import { isOpenNow } from '@/src/services/firestore/libraryBranchService';
import type { Library } from '@/src/types/library';

type LibraryHoursSectionProps = {
    library: Library | null;
    loading: boolean;
    onChooseLibrary?: () => void;
};

export function LibraryHoursSection({ library, loading, onChooseLibrary }: LibraryHoursSectionProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <SectionHeader title={S.libraryHours.title} />
            <Surface style={styles.card} elevation={2}>
                {loading ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {S.libraryHours.loading}
                    </Text>
                ) : !library ? (
                    // Member has not chosen a home library yet (nationwide edge case).
                    <View style={styles.chooseWrap}>
                        <Text variant="titleSmall" style={styles.name}>
                            {S.libraryHours.chooseTitle}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {S.libraryHours.chooseBody}
                        </Text>
                        <Button mode="outlined" onPress={onChooseLibrary} style={styles.chooseBtn}>
                            {S.libraryHours.chooseCta}
                        </Button>
                    </View>
                ) : (
                    <>
                        <View style={styles.statusRow}>
                            <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
                                {library.name}
                            </Text>
                            {(() => {
                                const open = isOpenNow(library);
                                const color = open ? theme.colors.primary : theme.colors.onSurfaceVariant;
                                return (
                                    <View
                                        style={styles.status}
                                        accessible
                                        accessibilityLabel={open ? S.libraryHours.openNow : S.libraryHours.closed}>
                                        <Icon
                                            source={open ? 'circle' : 'circle-outline'}
                                            size={12}
                                            color={color}
                                        />
                                        <Text variant="labelMedium" style={{ color, fontWeight: '800' }}>
                                            {open ? S.libraryHours.openNow : S.libraryHours.closed}
                                        </Text>
                                    </View>
                                );
                            })()}
                        </View>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                            {library.hours
                                ? `${library.hours.days}: ${library.hours.open} – ${library.hours.close}`
                                : S.libraryHours.hoursUnavailable}
                        </Text>
                        {library.contact ? (
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                {library.contact}
                            </Text>
                        ) : null}
                    </>
                )}
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    card: {
        borderRadius: 22,
        padding: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    status: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    name: {
        fontWeight: '800',
        flex: 1,
    },
    chooseWrap: {
        gap: 6,
    },
    chooseBtn: {
        alignSelf: 'flex-start',
        marginTop: 8,
    },
});
