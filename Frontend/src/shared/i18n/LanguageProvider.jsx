import { useEffect } from 'react'
import { ThemeProvider } from '../theme/ThemeProvider.jsx'
import i18n from './i18n.js'

export default function LanguageProvider({ children }) {
  useEffect(() => {
    document.documentElement.lang = i18n.language || 'en'

    const onLanguageChanged = (nextLanguage) => {
      document.documentElement.lang = nextLanguage
      localStorage.setItem('app_language', nextLanguage)
    }

    i18n.on('languageChanged', onLanguageChanged)
    return () => i18n.off('languageChanged', onLanguageChanged)
  }, [])

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
