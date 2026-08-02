import { BellRing, CalendarCheck, ShieldCheck, Ticket, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function AboutPage() {
  const { t } = useTranslation()

  const pillars = [
    { title: t('about.pillar1Title'), text: t('about.pillar1Text'), icon: BellRing },
    { title: t('about.pillar2Title'), text: t('about.pillar2Text'), icon: BellRing },
    { title: t('about.pillar3Title'), text: t('about.pillar3Text'), icon: Ticket },
  ]

  const audiences = [
    { title: t('about.forAttendees'), text: t('about.forAttendeesText'), icon: Users },
    { title: t('about.forOrganizers'), text: t('about.forOrganizersText'), icon: CalendarCheck },
    { title: t('about.forAdmins'), text: t('about.forAdminsText'), icon: ShieldCheck },
  ]

  const features = [
    t('about.feature1'),
    t('about.feature2'),
    t('about.feature3'),
    t('about.feature4'),
  ]

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-teal-900/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-100">{t('about.heroBadge')}</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">{t('about.heroTitle')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{t('about.heroText')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events"><Button variant="light">{t('browseEvents')}</Button></Link>
            <Link to="/register"><Button variant="pink">{t('createAccount')}</Button></Link>
          </div>
        </div>
      </section>

      <PageContainer>
        <section className="grid gap-5 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="transition hover:-translate-y-1 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Icon className="h-5 w-5" /></span>
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
              <p className="font-bold uppercase tracking-wide text-slate-700">{t('about.whyTitle')}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">{t('about.whyHeading')}</h2>
              <p className="mt-4 leading-7 text-slate-600">{t('about.whyText')}</p>
              <div className="mt-6 grid gap-3 text-sm text-slate-700">
                {features.map((feature) => <p key={feature}>✓ {feature}</p>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-slate-950">{t('about.audiencesTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('about.audiencesSubtitle')}</p>
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
