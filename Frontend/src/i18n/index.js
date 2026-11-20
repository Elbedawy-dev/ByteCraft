import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocal, setLocal, STORAGE_KEYS } from '../lib/storage';

const SUPPORTED_LANGS = ['ar', 'en'];
const DEFAULT_LANG = 'ar';

/**
 * Auto-load all locale JSON files under ./locales/{ar,en}/<namespace>.json.
 * Prompts 2-10 simply drop their own <namespace>.json files in locales/ar & locales/en
 * and call useTranslation('<namespace>').
 */
const localeModules = import.meta.glob('./locales/**/*.json', { eager: true });

const resources = {
  ar: {},
  en: {},
};

const namespaces = new Set(['common']);

for (const [filePath, moduleExports] of Object.entries(localeModules)) {
  const match = filePath.match(/^\.\/locales\/(ar|en)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, lng, ns] = match;
  resources[lng][ns] = moduleExports.default || moduleExports;
  namespaces.add(ns);
}

export function normalizeLang(value) {
  if (typeof value === 'string' && value.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'ar';
}

export function getInitialLang() {
  const saved = getLocal(STORAGE_KEYS.LANG, DEFAULT_LANG);
  return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

export function applyDocumentLang(lang) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeLang(lang);
  const root = document.documentElement;
  root.lang = normalized;
  root.dir = normalized === 'ar' ? 'rtl' : 'ltr';
}

const initialLang = getInitialLang();
applyDocumentLang(initialLang);

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: {
    en: ['ar'],
    ar: ['en'],
    default: [DEFAULT_LANG],
  },
  ns: Array.from(namespaces),
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLang(lng);
  applyDocumentLang(normalized);
  setLocal(STORAGE_KEYS.LANG, normalized);
});

export { SUPPORTED_LANGS, DEFAULT_LANG };
export default i18n;
