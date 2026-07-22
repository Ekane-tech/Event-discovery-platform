import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/ThemeProvider.jsx'
import { useTranslation } from '../../i18n/useTranslation.js'

/**
 * Compact light/dark toggle for the navbar.
 * Cycles between the resolved light and dark themes.
 */
export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
      title={isDark ? t('theme.switchToLight', 'Switch to light mode') : t('theme.switchToDark', 'Switch to dark mode')}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
