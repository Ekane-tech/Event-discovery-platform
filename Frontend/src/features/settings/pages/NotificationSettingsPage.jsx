import { BellRing, Mail, MessageSquare, Smartphone } from 'lucide-react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import PreferenceToggle from '../components/PreferenceToggle.jsx'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences.js'

export default function NotificationSettingsPage() {
  const { preferences, loading, saving, saved, error, togglePreference, savePreferences } = useNotificationPreferences()

  const notificationTypes = [
    ['interestMatches', 'Interest matches', 'Notify me when a new event matches my selected interests.'],
    ['eventReminders', 'Event reminders', 'Send reminders before events I registered for.'],
    ['organizerAnnouncements', 'Organizer announcements', 'Notify me when organizers I follow post announcements.'],
    ['adminMessages', 'Platform messages', 'Receive important platform messages and announcements.'],
  ]

  const channels = [
    ['database', 'In-app notifications', 'Show notifications inside the platform.', BellRing],
    ['email', 'Email notifications', 'Send notifications to my email address.', Mail],
    ['sms', 'SMS notifications', 'Send important notifications by SMS later.', MessageSquare],
    ['push', 'Push notifications', 'Use browser/mobile push notifications later.', Smartphone],
  ]

  if (loading) return <PageContainer><Loader message="Loading notification preferences..." /></PageContainer>

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-purple-700 to-blue-700 p-8 text-white">
        <BellRing className="h-10 w-10 text-purple-100" />
        <h1 className="mt-5 text-4xl font-black">Notification settings</h1>
        <p className="mt-3 max-w-2xl text-white/90">Choose what you want to receive and how you want to receive it.</p>
      </section>

      {saved && <div className="mt-6"><Alert type="success">Notification preferences saved.</Alert></div>}
      {error && <div className="mt-6"><Alert type="error">{error}</Alert></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-black text-slate-950">Notification types</h2>
          <div className="grid gap-3">{notificationTypes.map(([key, label, description]) => <PreferenceToggle key={key} label={label} description={description} checked={preferences[key]} onChange={() => togglePreference(key)} />)}</div>
        </Card>
        <Card>
          <h2 className="mb-4 font-black text-slate-950">Channels</h2>
          <div className="grid gap-3">{channels.map(([key, label, description, Icon]) => <div key={key} className="flex gap-3"><span className="mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-teal-700"><Icon className="h-5 w-5" /></span><div className="flex-1"><PreferenceToggle label={label} description={description} checked={preferences[key]} onChange={() => togglePreference(key)} /></div></div>)}</div>
        </Card>
      </div>
      <div className="mt-6 flex justify-end"><Button onClick={savePreferences} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button></div>
    </PageContainer>
  )
}
