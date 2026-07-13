import { createContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations.js'

export const LanguageContext = createContext(null)
const STORAGE_KEY = 'app_language'

function getNestedValue(object, path) {
  return path.split('.').reduce((current, key) => current?.[key], object)
}

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage)
  }

  function t(key, fallback = key) {
    return getNestedValue(translations[language], key) || getNestedValue(translations.en, key) || fallback
  }

  const value = useMemo(() => ({ language, setLanguage, t }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
