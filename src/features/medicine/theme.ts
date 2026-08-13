/**
 * Surface tokens for the medicine page, over the #f44b4b Silk field.
 *
 * CONTRAST — measured, not eyeballed. #f44b4b has a relative luminance of
 * 0.248:
 *   · black on it  6.0:1  ✓
 *   · white on it  3.5:1  ✗  for body copy
 * So nothing here is plain white text on the bare shader. Behind `bg-white/70`
 * the field flattens to about rgb(252,201,201), L≈0.667 — that is the surface
 * every card ratio below is measured against.
 *
 * Red is doing double duty on this page: it is the background, and it is also
 * the colour a warning wants to be. Warnings therefore never rely on being red
 * — each one carries an icon and a sentence that says what it is, and the
 * serious block is set apart by a solid dark fill rather than a hue.
 */

export const CARD = 'rounded-[20px] border border-white/50 bg-white/70 backdrop-blur-xl';
export const CARD_SOLID = 'rounded-[20px] border border-[#3B0A0A]/10 bg-white';

/** 11.6:1 on the card, 4.8:1 straight on #f44b4b. */
export const INK = 'text-[#3B0A0A]';
/** 6.3:1 on the card. Card copy only. */
export const MUTED = 'text-[#7A2E2E]';

/**
 * Copy sitting directly on the Silk. White alone is 3.5:1 here, so the outline
 * is not decoration — it is what keeps glyph edges legible against a moving
 * gradient. Same treatment as the community and resources pages.
 */
export const ON_SILK =
  'text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)]';
export const ON_SILK_MUTED = `${ON_SILK} opacity-90`;

/** Dark ring: a white one dissolves into the red. */
export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B0A0A] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const BTN =
  `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`;
export const BTN_SOLID = `${BTN} bg-[#3B0A0A] text-white hover:bg-[#5C1414]`;
export const BTN_QUIET = `${BTN} border border-[#3B0A0A]/25 bg-white/70 text-[#3B0A0A] hover:bg-white`;

/** 7.4:1 on the card. Never the only signal — always beside an icon and words. */
export const BAD = 'text-[#8B1111]';
/** 5.1:1 on the card, for the "read this" blocks that are not emergencies. */
export const NOTE = 'text-[#7A4A00]';

export const EYEBROW =
  'font-mono text-[11px] uppercase tracking-[0.14em]';

/**
 * How sure the model is, in words rather than only a number.
 *
 * A bare percentage invites people to read 60% as "mostly right". These bands
 * say what the number means for what they should do next, and the copy is the
 * signal — the colour only agrees with it.
 */
export function confidenceBand(confidence: number): {
  label: string;
  detail: string;
  tone: 'good' | 'fair' | 'poor';
} {
  if (confidence >= 80) {
    return {
      label: 'Confident',
      detail: 'The identification looks clear. Still worth a glance at the box.',
      tone: 'good',
    };
  }
  if (confidence >= 55) {
    return {
      label: 'Fairly sure',
      detail: 'Check the name below against the packaging before you rely on any of this.',
      tone: 'fair',
    };
  }
  return {
    label: 'Not sure',
    detail: 'Dosing is hidden at this confidence. Ask a pharmacist rather than trusting this.',
    tone: 'poor',
  };
}

/** When the daily allowance refills, in the reader's own clock. */
export function resetLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'midnight';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
