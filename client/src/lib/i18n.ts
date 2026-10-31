import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from '@/locales/ar.json';
import fr from '@/locales/fr.json';

/**
 * تهيئة i18next المركزية للمنصة.
 *
 * - اللغتان المدعومتان: العربية (ar) والفرنسية (fr).
 * - الموردان مضمّنان في الحزمة من ملفات JSON، فلا حاجة لطلب شبكة عند التبديل.
 * - اللغة تُحفظ في localStorage تحت المفتاح `lang` (نفس المفتاح المستخدم سابقاً)
 *   حتى لا يفقد المستخدمون الحاليون تفضيلهم.
 * - عند كل تغيير لغة يُحدَّث اتجاه المستند (RTL/LTR) وسمة lang والخط تلقائياً.
 */

export const LANGUAGE_STORAGE_KEY = 'lang';
export const SUPPORTED_LANGUAGES = ['ar', 'fr'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(language?: string | null): AppLanguage {
  return language && language.toLowerCase().startsWith('fr') ? 'fr' : 'ar';
}

/** يطبّق اللغة على جذر المستند: lang + dir + الخط (عبر class). */
export function applyDocumentLanguage(language: string): void {
  const lang = normalizeLanguage(language);
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  root.classList.toggle('lang-fr', lang === 'fr');
  root.classList.toggle('lang-ar', lang === 'ar');
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    fallbackLng: 'ar',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', applyDocumentLanguage);
applyDocumentLanguage(i18n.language);

export default i18n;
