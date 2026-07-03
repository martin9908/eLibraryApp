/**
 * Raw color tokens — the single source of truth for the eLibrary brand.
 * Framework-agnostic hex strings, consumed by both the web app (as CSS
 * custom properties) and the mobile app (as React Native / Paper colors).
 *
 * Palette follows the National Library of the Philippines / Philippine flag
 * colors codified in RA 8491: royal blue (Pantone 286), golden yellow
 * (Pantone 116), and red (Pantone 186).
 */
export const colors = {
    // Brand — Philippine royal blue (primary)
    brand: '#0038A8',
    brandLight: '#3E6FD6', // lifted royal blue (dark-mode primary, light accents)
    brandStrong: '#002E8C',
    brandDeep: '#001E66',
    navy: '#001343', // deepest navy (hero gradient end)

    // Accent — golden yellow
    gold: '#FCD116',
    goldSoft: '#FDE047',
    goldStrong: '#D9A800',

    // Accent — flag red
    red: '#CE1126',
    redStrong: '#A20D1E',

    // Surfaces
    bg: '#F4F6FB',
    surface: '#FFFFFF',
    surface2: '#F6F9FD',

    // Text (navy-tinted neutrals for an institutional feel)
    ink: '#0C1B3A',
    inkSoft: '#44506B',
    muted: '#8B96AD',

    // Lines
    line: '#E4E9F3',
    lineStrong: '#CDD6E7',

    // Semantic
    success: '#16A34A',
    successBg: '#ECFDF5',
    danger: '#CE1126', // flag red doubles as the alert color
    dangerBg: '#FEF2F2',
    warn: '#B7791F',
} as const;

export type ColorToken = keyof typeof colors;
