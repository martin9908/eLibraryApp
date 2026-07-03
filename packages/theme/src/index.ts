/**
 * @elibrary/theme
 * Single source of truth for the eLibrary color scheme, shared across the
 * mobile (Expo) and web (Next.js) apps. Zero runtime dependencies.
 *
 * Palette follows the National Library of the Philippines / Philippine flag
 * colors (RA 8491): royal blue primary, golden-yellow + red accents.
 *
 * - Web consumes {@link buildThemeCss} to emit `:root` CSS custom properties.
 * - Mobile consumes {@link paperColors}, {@link mobileGradients} and
 *   {@link mobileAccents} to build its React Native Paper + brand themes.
 *
 * Change a color here and both apps update.
 */
import { colors } from './palette';
import { gradients, gradientToCss } from './gradients';

export { colors } from './palette';
export type { ColorToken } from './palette';
export { gradients, gradientToCss } from './gradients';
export type { GradientSpec, GradientName } from './gradients';

type Mode = 'light' | 'dark';

/**
 * React Native Paper color roles per mode. `on*` colors are included so gold
 * (a light accent) renders dark, legible text/icons instead of white.
 */
export const paperColors: Record<Mode, {
    primary: string; onPrimary: string;
    secondary: string; onSecondary: string;
    tertiary: string; onTertiary: string;
}> = {
    light: {
        primary: colors.brand, onPrimary: '#FFFFFF',
        secondary: colors.gold, onSecondary: colors.navy,
        tertiary: colors.red, onTertiary: '#FFFFFF',
    },
    dark: {
        primary: colors.brandLight, onPrimary: colors.navy,
        secondary: colors.goldSoft, onSecondary: colors.navy,
        tertiary: '#F26D7D', onTertiary: colors.navy,
    },
};

/** Gradient color-stop arrays for expo-linear-gradient, per mode. */
export const mobileGradients: Record<Mode, {
    hero: readonly [string, string, ...string[]];
    cta: readonly [string, string, ...string[]];
    accent: readonly [string, string, ...string[]];
    accentAlt: readonly [string, string, ...string[]];
}> = {
    light: {
        hero: gradients.hero.stops,
        cta: gradients.brand.stops,
        accent: [colors.brandStrong, colors.brand], // eBooks tile — royal blue
        accentAlt: [colors.gold, colors.goldSoft], // Physical tile — gold
    },
    dark: {
        hero: gradients.heroDark.stops,
        cta: ['#1E5AC8', '#0038A8', '#001E66'],
        accent: [colors.brandLight, '#7EA3E8'],
        accentAlt: [colors.goldSoft, colors.gold],
    },
};

/** Standalone accent colors used by the mobile brand theme, per mode. */
export const mobileAccents: Record<Mode, {
    ratingStar: string;
    shadow: string;
    glow: string;
    categoryPalette: readonly string[];
}> = {
    light: {
        ratingStar: colors.gold,
        shadow: colors.ink,
        glow: 'rgba(0, 56, 168, 0.30)',
        categoryPalette: [colors.brand, colors.gold, colors.red, colors.brandLight, colors.goldStrong, colors.brandStrong, colors.redStrong],
    },
    dark: {
        ratingStar: colors.goldSoft,
        shadow: '#000000',
        glow: 'rgba(62, 111, 214, 0.28)',
        categoryPalette: ['#7EA3E8', colors.goldSoft, '#F26D7D', '#A9C2F0', '#FCD116', '#5B84DD', '#E8636F'],
    },
};

/**
 * Web: the color + gradient tokens as a `:root { … }` CSS string.
 * Inject this once (e.g. in the root layout) so `globals.css` can reference
 * `var(--indigo)` etc. Spacing/shadow/radius tokens stay in `globals.css`.
 *
 * Note: CSS var names (--indigo, --grad-brand, …) are kept stable for the web
 * stylesheet; their values now hold the national palette.
 */
export function buildThemeCss(): string {
    const vars: Record<string, string> = {
        '--indigo': colors.brand,
        '--indigo-600': colors.brandStrong,
        '--indigo-700': colors.brandDeep,
        '--gold': colors.gold,
        '--red': colors.red,
        '--grad-brand': gradientToCss(gradients.brand),
        '--grad-brand-soft': gradientToCss(gradients.brandSoft),
        '--grad-hero': gradientToCss(gradients.hero),
        '--bg': colors.bg,
        '--surface': colors.surface,
        '--surface-2': colors.surface2,
        '--ink': colors.ink,
        '--ink-soft': colors.inkSoft,
        '--muted': colors.muted,
        '--line': colors.line,
        '--line-strong': colors.lineStrong,
        '--success': colors.success,
        '--success-bg': colors.successBg,
        '--danger': colors.danger,
        '--danger-bg': colors.dangerBg,
        '--warn': colors.warn,
    };
    const body = Object.entries(vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
    return `:root {\n${body}\n}`;
}
