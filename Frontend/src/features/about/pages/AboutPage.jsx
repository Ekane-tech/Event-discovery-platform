import { BellRing, CalendarCheck, ShieldCheck, Ticket, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function AboutPage() {
  const { t } = useTranslation()

  const pillars = [
    { title: t('about.pillar1Title', 'Smart discovery'), text: t('about.pillar1Text', 'Find events by interests, location, date, price and activity signals.'), icon: BellRing },
    { title: t('about.pillar2Title', 'Relevant notifications'), text: t('about.pillar2Text', 'Receive updates when events match your interests or when registrations change.'), icon: BellRing },
    { title: t('about.pillar3Title', 'Digital tickets'), text: t('about.pillar3Text', 'Register, pay when needed, and keep event tickets in one place.'), icon: Ticket },
  ]

  const audiences = [
    { title: t('about.forAttendees', 'For attendees'), text: t('about.forAttendeesText', 'Discover events, choose interests, bookmark events, register, pay and manage tickets.'), icon: Users },
    { title: t('about.forOrganizers', 'For organizers'), text: t('about.forOrganizersText', 'Create events, upload images, manage attendees, review statistics and grow your audience.'), icon: CalendarCheck },
    { title: t('about.forAdmins', 'For administrators'), text: t('about.forAdminsText', 'Moderate events, manage users, announcements, reports, locations, categories and platform quality.'), icon: ShieldCheck },
  ]

  const features = [
    t('about.feature1', 'Personalized recommendations'),
    t('about.feature2', 'Event registration and tickets'),
    t('about.feature3', 'Organizer dashboards and attendee management'),
    t('about.feature4', 'Admin moderation, reports and announcements'),
  ]

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-teal-900/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">{t('about.heroBadge', 'About Mboa')}</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">{t('about.heroTitle', 'Your gateway to Cameroon’s events.')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{t('about.heroText', 'Mboa Events 237 connects attendees, organizers and administrators through personalized discovery, digital tickets, notifications and reliable event management across Cameroon.')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events"><Button variant="light">{t('browseEvents', 'Browse Events')}</Button></Link>
            <Link to="/register"><Button variant="pink">{t('createAccount', 'Create Account')}</Button></Link>
          </div>
        </div>
      </section>

      <PageContainer>
        <section className="grid gap-5 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="transition hover:-translate-y-1 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5" /></span>
                <h2 className="mt-5 text-xl font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </Card>
            )
          })}
        </section>

        <section className="mt-12 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid lg:grid-cols-2">
            <div className="min-h-[360px] bg-cover bg-center" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
            <div className="p-8 md:p-10">
              <p className="font-bold uppercase tracking-wide text-teal-700">{t('about.whyTitle', 'Why it matters')}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">{t('about.whyHeading', 'More than an event listing website.')}</h2>
              <p className="mt-4 leading-7 text-slate-600">{t('about.whyText', 'Mboa Events 237 is designed around discovery and action: users choose interests, organizers publish events, and the system notifies the right audience when something relevant happens.')}</p>
              <div className="mt-6 grid gap-3 text-sm text-slate-700">
                {features.map((feature) => <p key={feature}>✓ {feature}</p>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-slate-950">{t('about.audiencesTitle', 'Built for every role')}</h2>
            <p className="mt-2 text-slate-600">{t('about.audiencesSubtitle', 'Each experience is focused on what that user needs to do.')}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {audiences.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="text-center transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Card>
              )
            })}
          </div>
        </section>
      </PageContainer>
    </div>
  )
}
