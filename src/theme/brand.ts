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

const LIGHT: BrandColors = {
    heroGradient: ['#0B3FA8', '#1668E3', '#33A9FF'],
    heroText: '#FFFFFF',
    heroSubtext: 'rgba(255, 255, 255, 0.85)',
    heroField: 'rgba(255, 255, 255, 0.20)',
    heroFieldText: 'rgba(255, 255, 255, 0.92)',
    heroDecor: 'rgba(255, 255, 255, 0.10)',
    ctaGradient: ['#1668E3', '#33A9FF'],
    accentGradient: ['#1E88E5', '#42A5F5'],
    accentGradientAlt: ['#00A98F', '#2ED3B7'],
    ratingStar: '#FFB300',
    shadow: '#0D2B57',
    glow: 'rgba(37, 99, 235, 0.35)',
    categoryPalette: ['#1E88E5', '#00A98F', '#8E44E8', '#E8632C', '#D81B60', '#0EA5A0', '#3F51B5'],
};

const DARK: BrandColors = {
    heroGradient: ['#071B3A', '#0E3B7A', '#1E6FD0'],
    heroText: '#FFFFFF',
    heroSubtext: 'rgba(255, 255, 255, 0.80)',
    heroField: 'rgba(255, 255, 255, 0.14)',
    heroFieldText: 'rgba(255, 255, 255, 0.90)',
    heroDecor: 'rgba(255, 255, 255, 0.07)',
    ctaGradient: ['#1E6FD0', '#3AA0FF'],
    accentGradient: ['#1E88E5', '#4FB0FF'],
    accentGradientAlt: ['#0E8C77', '#2ED3B7'],
    ratingStar: '#FFC94D',
    shadow: '#000000',
    glow: 'rgba(59, 130, 246, 0.28)',
    categoryPalette: ['#5AB0FF', '#3FD9C0', '#B48CFF', '#FF9A6B', '#FF7BAE', '#57D7D2', '#8A97FF'],
};

export function getBrandColors(mode: 'light' | 'dark'): BrandColors {
    return mode === 'dark' ? DARK : LIGHT;
}

export function useBrandColors(): BrandColors {
    const colorScheme = useColorScheme();
    return getBrandColors(colorScheme === 'dark' ? 'dark' : 'light');
}
