'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, TranslationKey, getTranslation } from './i18n';

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  lang: 'ru',
  setLang: () => {},
  t: (key: TranslationKey) => getTranslation('ru', key),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('ru');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('flats_manager_lang') as Language;
      if (savedLang === 'ru' || savedLang === 'en') {
        setLangState(savedLang);
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flats_manager_lang', newLang);
    }
  };

  const t = (key: TranslationKey) => getTranslation(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
