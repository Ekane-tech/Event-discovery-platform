import { Monitor, Moon, Sun } from 'lucide-react'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useTheme } from '../../../shared/theme/ThemeProvider.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

const OPTIONS = [
  { value: 'light', icon: Sun, key: 'light' },
  { value: 'dark', icon: Moon, key: 'dark' },
  { value: 'system', icon: Monitor, key: 'system' },
]

export default function AppearanceSettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-teal-800 p-8 text-white">
        <Sun className="h-10 w-10 text-teal-200" />
        <h1 className="mt-5 text-4xl font-black">{t('settings.appearanceTitle', 'Appearance')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">
          {t('settings.appearanceDescription', 'Choose how Mboa Events looks. Dark mode is easier on the eyes at night.')}
        </p>
      </section>

      <Card className="mt-6 max-w-xl">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {t('settings.theme', 'Theme')}
        </span>
        <p className="mb-4 text-sm text-slate-500">
          {t('settings.appearanceHint', 'Your choice is saved on this device.')}
        </p>

        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map(({ value, icon: Icon, key }) => {
            const active = theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-bold transition ${
                  active
                    ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                <Icon className="h-6 w-6" />
                {t(`settings.theme${key.charAt(0).toUpperCase() + key.slice(1)}`, key)}
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {t('settings.appearanceActive', 'Currently active')}
          : <span className="font-semibold text-slate-700">{resolvedTheme}</span>
        </p>
      </Card>
    </PageContainer>
  )
}
