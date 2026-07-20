import { paperColors } from '@elibrary/theme';
import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Brand colors come from the shared @elibrary/theme package (single source of
// truth, kept in sync with the web app): indigo primary → violet → pink, with
// green for "Read"/secondary CTAs.
export function getPaperTheme(mode: 'light' | 'dark'): MD3Theme {
    if (mode === 'dark') {
        return {
            ...MD3DarkTheme,
            colors: {
                ...MD3DarkTheme.colors,
                primary: paperColors.dark.primary,
                onPrimary: paperColors.dark.onPrimary,
                secondary: paperColors.dark.secondary,
                onSecondary: paperColors.dark.onSecondary,
                tertiary: paperColors.dark.tertiary,
                onTertiary: paperColors.dark.onTertiary,
            },
        };
    }

    return {
        ...MD3LightTheme,
        colors: {
            ...MD3LightTheme.colors,
            primary: paperColors.light.primary,
            onPrimary: paperColors.light.onPrimary,
            secondary: paperColors.light.secondary,
            onSecondary: paperColors.light.onSecondary,
            tertiary: paperColors.light.tertiary,
            onTertiary: paperColors.light.onTertiary,
        },
    };
}