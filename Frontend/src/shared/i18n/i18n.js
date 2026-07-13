import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import frCommon from './locales/fr/common.json'

const STORAGE_KEY = 'app_language'
const defaultLanguage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || 'en' : 'en'

const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
}

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n
