import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import it from './locales/it.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

const resources = {
  en: { translation: en },
  it: { translation: it },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
};

// Get saved language from localStorage or default to 'it'
const savedLanguage = localStorage.getItem('appLanguage') || 'it';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
