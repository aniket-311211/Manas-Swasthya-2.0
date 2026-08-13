/**
 * The languages the site offers, in one place.
 *
 * The list used to be duplicated between the top bar and the old Navigation
 * component, which is how they drifted. Anything that needs to know about
 * languages reads this.
 */

export interface Language {
  code: string;
  /** The language's own name, in its own script — never a translation of it. */
  label: string;
  /** Perso-Arabic Kashmiri reads right to left; the other three do not. */
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: readonly Language[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'hi', label: 'हिंदी', dir: 'ltr' },
  { code: 'or', label: 'ଓଡ଼ିଆ', dir: 'ltr' },
  { code: 'ks', label: 'کٲشُر', dir: 'rtl' },
];

export const STORAGE_KEY = 'app_lang';

export function languageFor(code: string | undefined): Language {
  const base = (code ?? 'en').split('-')[0];
  return LANGUAGES.find((l) => l.code === base) ?? LANGUAGES[0];
}

/**
 * Tells the browser what it is rendering.
 *
 * `lang` drives screen-reader pronunciation and hyphenation; without it a
 * screen reader announces Odia with English phonetics. `dir` flips the whole
 * layout for Kashmiri — Tailwind's logical properties, text alignment and
 * scrollbar side all follow it, which is why this belongs on <html> rather
 * than on any one component.
 */
export function applyDocumentLanguage(code: string): void {
  if (typeof document === 'undefined') return;
  const lang = languageFor(code);
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
}
