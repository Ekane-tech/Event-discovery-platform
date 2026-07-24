import { BellRing, Mail, MessageSquare, Smartphone } from 'lucide-react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import PreferenceToggle from '../components/PreferenceToggle.jsx'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function NotificationSettingsPage() {
  const { t } = useTranslation()
  const { preferences, loading, saving, saved, error, togglePreference, savePreferences } = useNotificationPreferences()

  const notificationTypes = [
    ['interestMatches', t('settings.notifications.interestMatches', 'Interest matches'), t('settings.notifications.interestMatchesDesc', 'Notify me when a new event matches my selected interests.')],
    ['eventReminders', t('settings.notifications.eventReminders', 'Event reminders'), t('settings.notifications.eventRemindersDesc', 'Send reminders before events I registered for.')],
    ['organizerAnnouncements', t('settings.notifications.organizerAnnouncements', 'Organizer announcements'), t('settings.notifications.organizerAnnouncementsDesc', 'Notify me when organizers I follow post announcements.')],
    ['adminMessages', t('settings.notifications.platformMessages', 'Platform messages'), t('settings.notifications.platformMessagesDesc', 'Receive important platform messages and announcements.')],
  ]

  const channels = [
    ['database', t('settings.notifications.inApp', 'In-app notifications'), t('settings.notifications.inAppDesc', 'Show notifications inside the platform.'), BellRing],
    ['email', t('settings.notifications.email', 'Email notifications'), t('settings.notifications.emailDesc', 'Send notifications to my email address.'), Mail],
    ['sms', t('settings.notifications.sms', 'SMS notifications'), t('settings.notifications.smsDesc', 'Send important notifications by SMS later.'), MessageSquare],
    ['push', t('settings.notifications.push', 'Push notifications'), t('settings.notifications.pushDesc', 'Use browser/mobile push notifications later.'), Smartphone],
  ]

  if (loading) return <PageContainer><Loader message={t('settings.notifications.loading', 'Loading notification preferences...')} /></PageContainer>

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-purple-700 to-blue-700 p-8 text-white">
        <BellRing className="h-10 w-10 text-purple-100" />
        <h1 className="mt-5 text-4xl font-black">{t('settings.notificationTitle', 'Notification settings')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{t('settings.notificationDescription')}</p>
      </section>

      {saved && <div className="mt-6"><Alert type="success">{t('settings.notifications.saved', 'Notification preferences saved.')}</Alert></div>}
      {error && <div className="mt-6"><Alert type="error">{error}</Alert></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-black text-slate-950">{t('settings.notifications.typesTitle', 'Notification types')}</h2>
          <div className="grid gap-3">{notificationTypes.map(([key, label, description]) => <PreferenceToggle key={key} label={label} description={description} checked={preferences[key]} onChange={() => togglePreference(key)} />)}</div>
        </Card>
        <Card>
          <h2 className="mb-4 font-black text-slate-950">{t('settings.notifications.channelsTitle', 'Channels')}</h2>
          <div className="grid gap-3">{channels.map(([key, label, description, Icon]) => <div key={key} className="flex gap-3"><span className="mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-teal-700"><Icon className="h-5 w-5" /></span><div className="flex-1"><PreferenceToggle label={label} description={description} checked={preferences[key]} onChange={() => togglePreference(key)} /></div></div>)}</div>
        </Card>
      </div>
      <div className="mt-6 flex justify-end"><Button onClick={savePreferences} disabled={saving}>{saving ? t('common.saving', 'Saving...') : t('settings.notifications.save', 'Save Preferences')}</Button></div>
    </PageContainer>
  )
}
