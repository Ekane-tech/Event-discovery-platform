import { Link } from 'react-router-dom'
import { Database, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { APP_NAME } from '../../../shared/constants/app.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function PrivacyPolicyPage() {
  const { t } = useTranslation()

  const sections = [
    { title: t('legal.privacy.s1Title', 'Information we collect'), text: t('legal.privacy.s1Text', 'We collect account details, profile information, event interests, registration records, ticket data, payment references, feedback, reports and usage information needed to operate the platform.') },
    { title: t('legal.privacy.s2Title', 'How we use information'), text: t('legal.privacy.s2Text', 'We use information to authenticate users, recommend events, process registrations, verify tickets, send notifications, support organizers, secure the platform and improve services.') },
    { title: t('legal.privacy.s3Title', 'Email and notifications'), text: t('legal.privacy.s3Text', 'We may send verification emails, password reset emails, event updates, account status messages and important platform announcements. Users can manage notification preferences where available.') },
    { title: t('legal.privacy.s4Title', 'Payments and providers'), text: t('legal.privacy.s4Text', 'For paid events, payment details are handled through payment providers. We store transaction references and statuses but do not store mobile money PINs or sensitive wallet credentials.') },
    { title: t('legal.privacy.s5Title', 'Data protection'), text: t('legal.privacy.s5Text', 'We apply authentication, authorization, rate limiting, audit logs and operational controls to reduce unauthorized access and misuse of data.') },
  ]

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-teal-900/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><LockKeyhole className="h-4 w-4" /> {t('legal.privacyBadge', 'Privacy')}</span>
          <h1 className="mt-5 text-4xl font-black md:text-6xl">{t('legal.privacy.title', 'Privacy Policy')}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">{t('legal.privacy.intro', { app: APP_NAME, defaultValue: 'This policy explains how {{app}} collects, uses and protects user information.' })}</p>
        </div>
      </section>

      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5">
            <Card>
              <h2 className="text-2xl font-black text-slate-950">{t('legal.privacy.commitmentTitle', 'Our commitment')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.privacy.commitmentText', { app: APP_NAME, defaultValue: '{{app}} is designed to help people discover, book and experience events in Cameroon. We only collect information needed to provide, secure and improve the service.' })}</p>
            </Card>
            {sections.map((section) => <Card key={section.title}><h2 className="text-xl font-black text-slate-950">{section.title}</h2><p className="mt-3 leading-7 text-slate-600">{section.text}</p></Card>)}
            <Card>
              <h2 className="text-xl font-black text-slate-950">{t('legal.privacy.choicesTitle', 'Your choices')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.privacy.choicesText', 'You may update your profile, notification preferences and account settings from your dashboard. For privacy questions, contact our support team.')}</p>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <ShieldCheck className="h-8 w-8 text-teal-700" />
              <h2 className="mt-4 text-xl font-black text-slate-950">{t('legal.privacy.contactTitle', 'Contact privacy support')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('legal.privacy.contactText', 'For privacy questions or account data requests, contact us.')}</p>
              <a href="mailto:support@mboaevents237.cm" className="mt-4 block font-bold text-teal-700">support@mboaevents237.cm</a>
              <div className="mt-5 grid gap-2"><Link to="/terms-of-service"><Button variant="secondary" className="w-full">{t('legal.terms.title', 'Terms of Service')}</Button></Link><Link to="/feedback"><Button className="w-full"><Mail className="mr-2 h-4 w-4" />{t('legal.privacy.sendFeedback', 'Send Feedback')}</Button></Link></div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
