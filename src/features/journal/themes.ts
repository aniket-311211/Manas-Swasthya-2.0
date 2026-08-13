import { FONTS, PAPERS, type JournalPrefs } from './prefs';
import type { ThemeId } from './types';

/**
 * Two journal skins.
 *
 * Deliberately named for their character, not a gender — "Bloom" and "Carbon".
 * They cover the same brief (one soft/warm, one dark/graphic) without the app
 * telling a student which one is meant for them, and nothing stops anyone
 * picking either. The pack, the editor and the shelf all read from here.
 */

export interface JournalTheme {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Paper surface behind the writing. */
  paper: string;
  /** Subtle texture layered over the paper. */
  texture: string;
  /** Body text on paper. */
  ink: string;
  /** Secondary text on paper. */
  muted: string;
  /** Hairlines and rules. */
  line: string;
  /** Primary accent — buttons, active states. */
  accent: string;
  /** Text that sits on the accent. */
  onAccent: string;
  /** Edge of the 3D card. */
  edge: string;
  /** Drop shadow for the raised paper. */
  shadow: string;
  /** Display font stack for headings inside the journal. */
  display: string;
}

export const THEMES: Record<ThemeId, JournalTheme> = {
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    blurb: 'Warm paper, blush accents, soft edges',
    paper: 'linear-gradient(160deg,#FFFDF9 0%,#FFF4F0 55%,#FDECEF 100%)',
    texture:
      'radial-gradient(circle at 12% 18%, rgba(240,170,180,0.10) 0%, transparent 42%), radial-gradient(circle at 86% 76%, rgba(214,168,220,0.10) 0%, transparent 46%)',
    ink: '#3A2A32',
    muted: '#8A6F7A',
    line: '#F0DCE2',
    accent: '#C4557A',
    onAccent: '#FFFFFF',
    edge: '#F3DDE4',
    shadow: '0 24px 60px -28px rgba(150,80,105,0.45)',
    display: "'Playfair Display Variable', Georgia, serif",
  },
  carbon: {
    id: 'carbon',
    name: 'Carbon',
    blurb: 'Graphite slab, electric accent, hard edges',
    paper: 'linear-gradient(160deg,#1C2029 0%,#191D25 55%,#14181F 100%)',
    texture:
      'radial-gradient(circle at 82% 14%, rgba(90,190,220,0.12) 0%, transparent 44%), radial-gradient(circle at 14% 84%, rgba(120,130,170,0.10) 0%, transparent 46%)',
    ink: '#E8ECF3',
    muted: '#98A3B8',
    line: 'rgba(255,255,255,0.10)',
    accent: '#54C3D8',
    onAccent: '#0E1420',
    edge: 'rgba(255,255,255,0.14)',
    shadow: '0 24px 60px -28px rgba(0,0,0,0.75)',
    display: "'Playfair Display Variable', Georgia, serif",
  },
};

export const THEME_LIST: JournalTheme[] = [THEMES.bloom, THEMES.carbon];

export function themeOf(id: ThemeId | undefined): JournalTheme {
  return id === 'carbon' ? THEMES.carbon : THEMES.bloom;
}

/** Inline style for the raised paper surface, shared by editor and shelf. */
export function paperStyle(theme: JournalTheme): React.CSSProperties {
  return {
    backgroundImage: `${theme.texture}, ${theme.paper}`,
    color: theme.ink,
    borderColor: theme.edge,
    boxShadow: theme.shadow,
  };
}

/* ---------------------------------------------------------------------------
 * Personalisation, folded over a theme.
 *
 * Additive on purpose: THEMES, THEME_LIST, themeOf and paperStyle above are
 * imported by four other files and behave exactly as they did. Everything below
 * takes a theme and hands back another theme, so both paths compose.
 * ------------------------------------------------------------------------- */

function rgbOf(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Luminance of #1B2430, the shell ink. Hard-coded so this stays a pure lookup. */
const INK_LUMINANCE = 0.0157;

/**
 * Readable text for an arbitrary accent. Someone can pick any of the swatches
 * (and a repaired pref can hold any valid hex), so the pair is computed rather
 * than authored — contrast is not something to eyeball per colour.
 */
export function onAccentFor(hex: string): string {
  const l = luminance(hex);
  const onWhite = 1.05 / (l + 0.05);
  const onInk = (l + 0.05) / (INK_LUMINANCE + 0.05);
  return onWhite >= onInk ? '#FFFFFF' : '#1B2430';
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * The chosen accent, its readable partner, and a soft wash of that accent laid
 * into the paper's own texture — the wash is what keeps a page from reading as
 * plain white. Everything else about the theme survives.
 */
export function applyPrefs(theme: JournalTheme, prefs: JournalPrefs): JournalTheme {
  return {
    ...theme,
    accent: prefs.accent,
    onAccent: onAccentFor(prefs.accent),
    texture: `radial-gradient(120% 90% at 6% 0%, ${rgba(prefs.accent, 0.16)} 0%, transparent 56%), radial-gradient(110% 85% at 100% 100%, ${rgba(prefs.accent, 0.1)} 0%, transparent 52%), ${theme.texture}`,
  };
}

/**
 * paperStyle plus the surface texture, the ruled lines and the writing face.
 *
 * `fontSize` scales the sheet, so text inside it should size in `em`/`rem` —
 * a child pinned to `text-[16px]` opts itself out of the size slider.
 */
export function paperStyleWithPrefs(theme: JournalTheme, prefs: JournalPrefs): React.CSSProperties {
  const t = applyPrefs(theme, prefs);
  const rule = `repeating-linear-gradient(to bottom, transparent 0 calc(1.75em - 1px), ${t.line} calc(1.75em - 1px) 1.75em)`;
  const layers = [
    prefs.ruled ? rule : '',
    PAPERS.find((p) => p.id === prefs.paper)?.css ?? '',
    t.texture,
    t.paper,
  ].filter(Boolean);
  return {
    ...paperStyle(t),
    backgroundImage: layers.join(', '),
    fontFamily: FONTS.find((f) => f.id === prefs.fontId)?.stack,
    fontSize: `${prefs.fontScale}rem`,
  };
}
