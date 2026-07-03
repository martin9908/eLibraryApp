/**
 * Gradient definitions shared across web and mobile.
 *
 * Each spec carries an angle (CSS degrees), ordered color stops, and optional
 * 0–1 stop positions. Web renders them via {@link gradientToCss}; mobile passes
 * `stops` (and optional `locations`) to expo-linear-gradient.
 */
export interface GradientSpec {
    /** Angle in CSS degrees (top-to-bottom = 180). */
    angle: number;
    /** Ordered color stops. At least two. */
    stops: readonly [string, string, ...string[]];
    /** Optional 0–1 positions, one per stop, for precise placement. */
    locations?: readonly number[];
}

export const gradients = {
    /** Primary brand gradient — buttons, brand marks, CTAs (royal-blue sweep). */
    brand: { angle: 135, stops: ['#1E5AC8', '#0038A8', '#002E8C'], locations: [0, 0.5, 1] },
    /** Tinted brand wash — soft backgrounds, empty covers. */
    brandSoft: { angle: 135, stops: ['#E8F0FF', '#EFF4FF', '#E8F0FF'], locations: [0, 0.5, 1] },
    /** Hero / header gradient (light mode): royal blue → deep navy. */
    hero: { angle: 140, stops: ['#0B4DD4', '#0038A8', '#001343'], locations: [0, 0.5, 1] },
    /** Hero / header gradient (dark mode). */
    heroDark: { angle: 140, stops: ['#001A5C', '#001343', '#000A2A'], locations: [0, 0.5, 1] },
} as const satisfies Record<string, GradientSpec>;

export type GradientName = keyof typeof gradients;

/** Render a {@link GradientSpec} as a CSS `linear-gradient(...)` string. */
export function gradientToCss(spec: GradientSpec): string {
    const stops = spec.stops.map((color, i) => {
        const pos = spec.locations?.[i];
        return pos == null ? color : `${color} ${Math.round(pos * 100)}%`;
    });
    return `linear-gradient(${spec.angle}deg, ${stops.join(', ')})`;
}
