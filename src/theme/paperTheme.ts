import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Library app: Blue primary, Green accent
const brandLightPrimary = '#2196F3';
const brandLightAccent = '#4CAF50';
const brandDarkPrimary = '#8BD9F3';
const brandDarkAccent = '#81C784';

export function getPaperTheme(mode: 'light' | 'dark'): MD3Theme {
    if (mode === 'dark') {
        return {
            ...MD3DarkTheme,
            colors: {
                ...MD3DarkTheme.colors,
                primary: brandDarkPrimary,
                secondary: brandDarkAccent,
                tertiary: brandDarkAccent,
            },
        };
    }

    return {
        ...MD3LightTheme,
        colors: {
            ...MD3LightTheme.colors,
            primary: brandLightPrimary,
            secondary: brandLightAccent,
            tertiary: brandLightAccent,
        },
    };
}