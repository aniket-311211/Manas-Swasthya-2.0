import { useSyncExternalStore } from 'react';
import type { ThemeId } from './types';

/**
 * How the journal looks to *you* — kept per device, not per row.
 *
 * ponytail: localStorage, not a table. There is no user-prefs endpoint and no
 * migration budget for six cosmetic values; a schema change to remember
 * someone's favourite paper would cost more than the feature. Add a column the
 * day prefs need to follow a user across devices.
 *
 * Everything above the hook is pure, so it tests in the node vitest env.
 */

const KEY = 'nmc:journal:prefs:v1';

export type PaperId = 'plain' | 'grid' | 'linen' | 'margin';
export type FontId = 'inter' | 'playfair' | 'instrument' | 'barlow' | 'mono';

export interface JournalPrefs {
  theme: ThemeId;
  /** Hex, overrides the theme accent. */
  accent: string;
  /** Surface texture choice. */
  paper: PaperId;
  /** Writing typeface. */
  fontId: FontId;
  /** 0.9 – 1.25 */
  fontScale: number;
  /** Ruled lines on the paper. */
  ruled: boolean;
}

export const SCALE_MIN = 0.9;
export const SCALE_MAX = 1.25;

/**
 * Every accent is picked to clear 4.5:1 against at least one of white or the
 * shell ink — `onAccentFor` in themes.ts decides which, per colour.
 */
export const ACCENTS: { id: string; name: string; hex: string }[] = [
  { id: 'rose', name: 'Rose', hex: '#C4557A' },
  { id: 'indigo', name: 'Indigo', hex: '#2E3A59' },
  { id: 'teal', name: 'Teal', hex: '#2F7D74' },
  { id: 'moss', name: 'Moss', hex: '#4A7A3E' },
  { id: 'amber', name: 'Amber', hex: '#B5800F' },
  { id: 'clay', name: 'Clay', hex: '#B4613C' },
  { id: 'plum', name: 'Plum', hex: '#6B57A6' },
  { id: 'sky', name: 'Sky', hex: '#3E7CA6' },
];

/**
 * Texture ink mixed from the paper's own text colour, so one string works on
 * Bloom's cream and Carbon's graphite without a per-theme table. Sizes are in
 * `em` so a texture scales with the writing size instead of fighting it.
 */
const T = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;

export const PAPERS: { id: PaperId; name: string; css: string }[] = [
  { id: 'plain', name: 'Plain', css: '' },
  {
    id: 'grid',
    name: 'Grid',
    css: `repeating-linear-gradient(to right, ${T(7)} 0 1px, transparent 1px 1.5em), repeating-linear-gradient(to bottom, ${T(7)} 0 1px, transparent 1px 1.5em)`,
  },
  {
    id: 'linen',
    name: 'Linen',
    css: `repeating-linear-gradient(45deg, ${T(5)} 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, ${T(5)} 0 1px, transparent 1px 6px)`,
  },
  {
    id: 'margin',
    name: 'Margin',
    css: `linear-gradient(to right, transparent 0 2.25em, ${T(24)} 2.25em, ${T(24)} calc(2.25em + 1px), transparent calc(2.25em + 1px))`,
  },
];

/**
 * Only faces the app already ships: Inter and Playfair via @fontsource, Barlow
 * and Instrument Serif via the Google link in index.html, and the system mono.
 * Adding a font here means adding a download — check index.html first.
 */
export const FONTS: { id: FontId; name: string; stack: string }[] = [
  { id: 'inter', name: 'Inter', stack: "'Inter Variable', system-ui, sans-serif" },
  { id: 'playfair', name: 'Playfair', stack: "'Playfair Display Variable', Georgia, serif" },
  { id: 'instrument', name: 'Instrument', stack: "'Instrument Serif', Georgia, serif" },
  { id: 'barlow', name: 'Barlow', stack: "'Barlow', system-ui, sans-serif" },
  { id: 'mono', name: 'Typewriter', stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

/** Bloom's own rose, so an untouched journal looks exactly like the theme. */
export const DEFAULT_PREFS: JournalPrefs = {
  theme: 'bloom',
  accent: '#C4557A',
  paper: 'plain',
  fontId: 'inter',
  fontScale: 1,
  ruled: true,
};

/** Accent goes straight into a style attribute and localStorage is user-writable. */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function oneOf<T extends string>(value: unknown, list: readonly { id: T }[], fallback: T): T {
  return list.some((o) => o.id === value) ? (value as T) : fallback;
}

/**
 * Repairs field by field. A hand-edited or half-written value loses only
 * itself — nobody's whole notebook resets because one key went bad.
 */
function normalize(raw: unknown): JournalPrefs {
  const p = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<JournalPrefs>;
  const scale = p.fontScale;
  return {
    theme: p.theme === 'carbon' ? 'carbon' : 'bloom',
    accent: typeof p.accent === 'string' && HEX.test(p.accent) ? p.accent : DEFAULT_PREFS.accent,
    paper: oneOf(p.paper, PAPERS, DEFAULT_PREFS.paper),
    fontId: oneOf(p.fontId, FONTS, DEFAULT_PREFS.fontId),
    fontScale:
      typeof scale === 'number' && Number.isFinite(scale)
        ? Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale))
        : DEFAULT_PREFS.fontScale,
    ruled: typeof p.ruled === 'boolean' ? p.ruled : DEFAULT_PREFS.ruled,
  };
}

export function loadPrefs(): JournalPrefs {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return normalize(raw == null ? null : JSON.parse(raw));
  } catch {
    // Corrupt JSON, a blocked store, or no store at all. Cosmetics never crash a page.
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: JournalPrefs): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private mode or a full quota. The choice still applies for this session.
  }
}

let cache: JournalPrefs | null = null;
const listeners = new Set<() => void>();

function snapshot(): JournalPrefs {
  return (cache ??= loadPrefs());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function update(patch: Partial<JournalPrefs>): void {
  cache = normalize({ ...snapshot(), ...patch });
  savePrefs(cache);
  for (const fn of listeners) fn();
}

/**
 * ponytail: one module-level store read through useSyncExternalStore, not a
 * context provider. The panel and the sheet it restyles are different subtrees,
 * and per-mount useState copies would visibly disagree the moment both mount.
 */
export function useJournalPrefs(): [JournalPrefs, (patch: Partial<JournalPrefs>) => void] {
  return [useSyncExternalStore(subscribe, snapshot, snapshot), update];
}
