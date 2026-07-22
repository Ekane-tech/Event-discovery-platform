import { Bell, Globe2, Lock, Palette, UserCog } from 'lucide-react'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SettingsCard from '../components/SettingsCard.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

const iconMap = { UserCog, Globe2, Bell, Lock, Palette }

export default function SettingsPage() {
  const { t } = useTranslation()
  const settings = [
    { title: t('settings.accountTitle', 'Account settings'), description: t('settings.accountDescription', 'Manage profile, phone, city, region, photo and bio.'), to: '/settings/account', icon: 'UserCog' },
    { title: t('settings.appearanceTitle', 'Appearance'), description: t('settings.appearanceCardDescription', 'Switch between light and dark mode.'), to: '/settings/appearance', icon: 'Palette' },
    { title: t('settings.languageTitle', 'Language settings'), description: t('settings.languageDescription', 'Choose your preferred language.'), to: '/settings/language', icon: 'Globe2' },
    { title: t('settings.notificationTitle', 'Notification settings'), description: t('settings.notificationDescription', 'Choose notifications and delivery channels.'), to: '/settings/notifications', icon: 'Bell' },
    { title: t('settings.securityTitle', 'Security settings'), description: t('settings.securityDescription', 'Manage your password and account security.'), to: '/settings/security', icon: 'Lock' },
  ]

  return (
    <PageContainer>
      <section className="rounded-3xl bg-slate-950 p-8 text-white">
        <h1 className="text-4xl font-black">{t('settings.title', 'Settings')}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{t('settings.description')}</p>
      </section>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {settings.map((item) => (
          <SettingsCard key={item.to} {...item} icon={iconMap[item.icon]} />
        ))}
      </div>
    </PageContainer>
  )
}
