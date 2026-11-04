import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import i18n, { normalizeLanguage, type AppLanguage } from '@/lib/i18n';
import ar from '@/locales/ar.json';

export type TranslationKey = keyof typeof ar;

/**
 * واجهة التوافق (Compatibility Layer) لنظام الترجمة.
 *
 * المحرك الفعلي أصبح i18next (client/src/lib/i18n.ts)، لكن هذه الواجهة تحافظ
 * على نفس التوقيع القديم (lang / dir / t / setLang) المستخدم في أكثر من
 * خمسين مكوّناً، فلا حاجة لتعديلها جميعاً دفعة واحدة. أي مكوّن جديد يمكنه
 * استخدام useTranslation() من react-i18next مباشرة.
 */

export type Language = AppLanguage;
export type Direction = 'rtl' | 'ltr';

interface I18nContextProps {
  lang: Language;
  dir: Direction;
  t: (key: string, options?: Record<string, unknown>) => string;
  setLang: (newLang: Language) => void;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => normalizeLanguage(i18n.language));

  // مزامنة الحالة مع أي تغيير لغة يحدث خارج هذا المزود (مثل useTranslation).
  useEffect(() => {
    const handleLanguageChanged = (next: string) => {
      setLangState(normalizeLanguage(next));
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('lang', lang);
  }, [lang, dir]);

  const setLang = useCallback((newLang: Language) => {
    void i18n.changeLanguage(newLang);
  }, []);

  const t = useCallback((key: string, options?: Record<string, unknown>): string => {
    let text = i18n.t(key as TranslationKey, options as never) as unknown as string;
    if (options && typeof text === 'string') {
      for (const [k, v] of Object.entries(options)) {
        if (v !== undefined && v !== null) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
    }
    return text;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, dir, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
