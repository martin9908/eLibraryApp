import { mobileAccents, mobileGradients } from '@elibrary/theme';

import { useColorScheme } from '@/hooks/use-color-scheme';

type Gradient = readonly [string, string, ...string[]];

export type BrandColors = {
    /** Hero header gradient stops (top-left → bottom-right). */
    heroGradient: Gradient;
    /** Text rendered on top of the hero gradient. */
    heroText: string;
    /** Muted text on top of the hero gradient. */
    heroSubtext: string;
    /** Search field surface sitting on the hero gradient. */
    heroField: string;
    heroFieldText: string;
    /** Translucent decorative shapes layered over the hero. */
    heroDecor: string;
    /** Primary call-to-action gradient (e.g. Borrow button). */
    ctaGradient: Gradient;
    /** Accent gradient used for the eBooks quick action tile. */
    accentGradient: Gradient;
    /** Secondary accent gradient used for the Physical Books tile. */
    accentGradientAlt: Gradient;
    /** Rating star fill. */
    ratingStar: string;
    /** Shadow color for elevated cards. */
    shadow: string;
    /** Colored glow used behind featured artwork. */
    glow: string;
    /** Palette used to tint category chips in rotation. */
    categoryPalette: readonly string[];
};

// Colors come from the shared @elibrary/theme package (single source of truth,
// kept in sync with the web app). The white-on-gradient overlays below are
// mobile-only presentation details, so they stay local.
const LIGHT: BrandColors = {
    heroGradient: mobileGradients.light.hero,
    heroText: '#FFFFFF',
    heroSubtext: 'rgba(255, 255, 255, 0.85)',
    heroField: 'rgba(255, 255, 255, 0.20)',
    heroFieldText: 'rgba(255, 255, 255, 0.92)',
    heroDecor: 'rgba(255, 255, 255, 0.10)',
    ctaGradient: mobileGradients.light.cta,
    accentGradient: mobileGradients.light.accent,
    accentGradientAlt: mobileGradients.light.accentAlt,
    ratingStar: mobileAccents.light.ratingStar,
    shadow: mobileAccents.light.shadow,
    glow: mobileAccents.light.glow,
    categoryPalette: mobileAccents.light.categoryPalette,
};

const DARK: BrandColors = {
    heroGradient: mobileGradients.dark.hero,
    heroText: '#FFFFFF',
    heroSubtext: 'rgba(255, 255, 255, 0.80)',
    heroField: 'rgba(255, 255, 255, 0.14)',
    heroFieldText: 'rgba(255, 255, 255, 0.90)',
    heroDecor: 'rgba(255, 255, 255, 0.07)',
    ctaGradient: mobileGradients.dark.cta,
    accentGradient: mobileGradients.dark.accent,
    accentGradientAlt: mobileGradients.dark.accentAlt,
    ratingStar: mobileAccents.dark.ratingStar,
    shadow: mobileAccents.dark.shadow,
    glow: mobileAccents.dark.glow,
    categoryPalette: mobileAccents.dark.categoryPalette,
};

export function getBrandColors(mode: 'light' | 'dark'): BrandColors {
    return mode === 'dark' ? DARK : LIGHT;
}

export function useBrandColors(): BrandColors {
    const colorScheme = useColorScheme();
    return getBrandColors(colorScheme === 'dark' ? 'dark' : 'light');
}
