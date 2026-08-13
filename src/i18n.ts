import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEY, applyDocumentLanguage, languageFor } from '@/lib/languages';

type Locale = Record<string, string>;

// Eagerly import all locale JSON files at build-time. Whether a JSON module
// arrives bare or wrapped in `default` depends on the resolver, so the type
// admits both and the code below narrows.
const modules: Record<string, unknown> = import.meta.glob('../locales/*/translation.json', {
  eager: true,
});

/**
 * A JSON module arrives either bare or wrapped in `default` depending on the
 * resolver, and `Record<string, string>` cannot distinguish the two by type
 * alone — a locale is free to contain a key called "default". So the shape is
 * settled at runtime and the type is claimed once, here.
 */
function asLocale(mod: unknown): Locale | undefined {
  if (!mod || typeof mod !== 'object') return undefined;
  const inner = (mod as { default?: unknown }).default;
  return (inner && typeof inner === 'object' ? inner : mod) as Locale;
}

function buildResources() {
  const res: Record<string, { translation: Record<string, string> }> = {};
  Object.keys(modules).forEach((key) => {
    // key example: ../locales/en/translation.json
    const match = key.match(/\.\.\/locales\/(.*?)\/translation\.json$/);
    if (match) {
      const lng = match[1];
      const data = asLocale(modules[key]);
      if (data) {
        res[lng] = { translation: data };
      }
    }
  });
  return res;
}

export async function setupI18n() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  // An unknown or removed code falls back rather than leaving i18next on a
  // language with no resources, where every key renders as its own name.
  const lng = languageFor(saved ?? undefined).code;

  await i18n.use(initReactI18next).init({
    resources: buildResources(),
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

  applyDocumentLanguage(lng);
  // Direction and the <html lang> attribute have to follow every later switch
  // too, not just the one at startup.
  i18n.on('languageChanged', applyDocumentLanguage);

  return i18n;
}

export default i18n;


