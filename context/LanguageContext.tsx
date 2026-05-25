'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  translations,
  type LanguageCode,
  getTranslation,
} from '@/lib/translations';

interface LanguageContextType {
  language: LanguageCode;
  t: (key: string, defaultValue?: string) => string;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load language preference from localStorage
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('kapadmitra_language') as
      | LanguageCode
      | null;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'gu' || savedLanguage === 'hi' || savedLanguage === 'hg')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('kapadmitra_language', lang);
  }, []);

  const t = useCallback(
    (key: string, defaultValue?: string) => {
      const currentTranslations = getTranslation(language);
      return (
        (currentTranslations as Record<string, string>)[key] ||
        defaultValue ||
        key
      );
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
