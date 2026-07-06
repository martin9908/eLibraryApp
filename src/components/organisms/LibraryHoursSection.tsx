import { StyleSheet, View } from 'react-native';
import { Button, Icon, Surface, Text, useTheme } from 'react-native-paper';

import { SectionHeader } from '@/src/components/molecules';
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
            <SectionHeader title="Library Hours" />
            <Surface style={styles.card} elevation={2}>
                {loading ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Loading…
                    </Text>
                ) : !library ? (
                    // Member has not chosen a home library yet (nationwide edge case).
                    <View style={styles.chooseWrap}>
                        <Text variant="titleSmall" style={styles.name}>
                            Choose your library
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Set your home library to see local hours and physical-book availability.
                        </Text>
                        <Button mode="outlined" onPress={onChooseLibrary} style={styles.chooseBtn}>
                            Choose a library
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
                                    <View style={styles.status}>
                                        <Icon
                                            source={open ? 'circle' : 'circle-outline'}
                                            size={12}
                                            color={color}
                                        />
                                        <Text variant="labelMedium" style={{ color, fontWeight: '800' }}>
                                            {open ? 'Open Now' : 'Closed'}
                                        </Text>
                                    </View>
                                );
                            })()}
                        </View>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                            {library.hours
                                ? `${library.hours.days}: ${library.hours.open} – ${library.hours.close}`
                                : 'Hours unavailable'}
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
