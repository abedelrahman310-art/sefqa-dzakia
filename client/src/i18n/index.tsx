import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ar, TranslationKey } from './ar';
import { fr } from './fr';

export type Language = 'ar' | 'fr';
export type Direction = 'rtl' | 'ltr';
export type { TranslationKey };

interface I18nContextProps {
  lang: Language;
  dir: Direction;
  t: (key: TranslationKey) => string;
  setLang: (newLang: Language) => void;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

const dictionaries = {
  ar,
  fr,
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'ar' || saved === 'fr') ? saved : 'ar';
  });

  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('lang', lang);
  }, [lang, dir]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = (key: TranslationKey): string => {
    return dictionaries[lang][key] || key;
  };

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
