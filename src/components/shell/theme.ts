/**
 * Dashboard surface + type tokens.
 *
 * The background is a live iridescence shader, so surfaces are translucent and
 * blurred rather than opaque — the shader is meant to read through them. Colour
 * is a neutral ink scale with a single deep-indigo accent, chosen so it never
 * competes with the pastels moving underneath.
 *
 * ponytail: plain exported class strings, not a theme provider or a cva recipe.
 * One import, one place to retune.
 */

// Ink scale
export const INK = '#1B2430'; // headings, primary text
export const MUTED = '#5A6472'; // body, secondary text
export const META = '#8A93A3'; // eyebrows, timestamps, axis labels
export const ACCENT = '#2E3A59'; // links, CTAs, focus rings, chart line
export const DANGER = '#C0533F'; // crisis, live, errors
export const HAIRLINE = '#E4E7EE'; // non-card borders: inputs, chips, grid
export const CHIP = '#EEF0F5'; // chips, icon tiles, quiet buttons

/** Light cards. Iridescence glows through. */
export const GLASS =
  'rounded-[20px] border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(27,36,48,0.08)]';

/** Dense cards (chart, journal) — near-solid so small text stays legible. */
export const GLASS_SOLID =
  'rounded-[20px] border border-white/70 bg-white/[0.88] backdrop-blur-xl shadow-[0_8px_32px_rgba(27,36,48,0.08)]';

/** The one dark anchor card. */
export const INK_CARD =
  'rounded-[20px] border border-white/10 bg-[#1B2430]/90 backdrop-blur-xl shadow-[0_12px_40px_rgba(27,36,48,0.22)]';

export const EYEBROW = 'font-mono text-[11px] uppercase tracking-[0.14em] text-[#8A93A3]';

export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]';

export const CTA_LINK = `rounded text-[13px] font-semibold text-[#2E3A59] hover:underline ${FOCUS}`;
