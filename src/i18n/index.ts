 import i18n from 'i18next';
 import { initReactI18next } from 'react-i18next';
 import LanguageDetector from 'i18next-browser-languagedetector';
 
 import en from './locales/en.json';
 import hi from './locales/hi.json';
 import kn from './locales/kn.json';
 import ml from './locales/ml.json';
 import te from './locales/te.json';
 
 export const languages = [
   { code: 'en', name: 'English', nativeName: 'English' },
   { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
   { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
   { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
   { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
 ];
 
 i18n
   .use(LanguageDetector)
   .use(initReactI18next)
   .init({
     resources: {
       en: { translation: en },
       hi: { translation: hi },
       kn: { translation: kn },
       ml: { translation: ml },
       te: { translation: te },
     },
     fallbackLng: 'en',
     interpolation: {
       escapeValue: false,
     },
     detection: {
       order: ['localStorage', 'navigator'],
       caches: ['localStorage'],
     },
   });
 
 export default i18n;