import { useTranslation as useReactTranslation } from 'react-i18next'

export function useTranslation() {
  const { t, i18n } = useReactTranslation()

  return {
    t,
    language: i18n.language || 'en',
    setLanguage: (nextLanguage) => i18n.changeLanguage(nextLanguage),
  }
}
