import { BellRing, CalendarCheck, ShieldCheck, Sparkles, Ticket, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

const pillars = [
  { titleKey: 'about.pillar1Title', textKey: 'about.pillar1Text', icon: Sparkles },
  { titleKey: 'about.pillar2Title', textKey: 'about.pillar2Text', icon: BellRing },
  { titleKey: 'about.pillar3Title', textKey: 'about.pillar3Text', icon: Ticket },
]

const audiences = [
  { titleKey: 'about.audience1Title', textKey: 'about.audience1Text', icon: Users },
  { titleKey: 'about.audience2Title', textKey: 'about.audience2Text', icon: CalendarCheck },
]

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-teal-900/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Sparkles className="h-4 w-4" /> {t('about.badge')}</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">{t('about.heading')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{t('about.description')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events"><Button variant="light">{t('about.browseEvents')}</Button></Link>
            <Link to="/register"><Button variant="pink">{t('about.createAccount')}</Button></Link>
          </div>
        </div>
      </section>

      <PageContainer>
        <section className="grid gap-5 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.titleKey} className="transition hover:-translate-y-1 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5" /></span>
                <h2 className="mt-5 text-xl font-black text-slate-950">{t(item.titleKey)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(item.textKey)}</p>
              </Card>
            )
          })}
        </section>

        <section className="mt-12 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid lg:grid-cols-2">
            <div className="min-h-[360px] bg-cover bg-center" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
            <div className="p-8 md:p-10">
              <p className="font-bold uppercase tracking-wide text-teal-700">{t('about.whyLabel')}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">{t('about.whyTitle')}</h2>
              <p className="mt-4 leading-7 text-slate-600">{t('about.whyText')}</p>
              <div className="mt-6 grid gap-3 text-sm text-slate-700">
                <p>{t('about.bullet1')}</p>
                <p>{t('about.bullet2')}</p>
                <p>{t('about.bullet3')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-slate-950">{t('about.builtForTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('about.builtForSubtitle')}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {audiences.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.titleKey} className="text-center transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{t(item.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(item.textKey)}</p>
                </Card>
              )
            })}
          </div>
        </section>
      </PageContainer>
    </div>
  )
}
