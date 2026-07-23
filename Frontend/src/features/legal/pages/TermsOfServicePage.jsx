import { Link } from 'react-router-dom'
import { FileText, ShieldCheck, Ticket } from 'lucide-react'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { APP_NAME } from '../../../shared/constants/app.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function TermsOfServicePage() {
  const { t } = useTranslation()

  const sections = [
    { title: t('legal.terms.s1Title', 'Account responsibilities'), text: t('legal.terms.s1Text', 'Users must provide accurate information, protect their login credentials, verify their email address when required, and use the platform lawfully.') },
    { title: t('legal.terms.s2Title', 'Event publication'), text: t('legal.terms.s2Text', 'Organizers are responsible for publishing accurate event details, prices, ticket types, venue information, schedules and images. False, abusive or misleading events may be removed.') },
    { title: t('legal.terms.s3Title', 'Registrations and tickets'), text: t('legal.terms.s3Text', 'Tickets are linked to confirmed registrations and may be verified using QR codes at event entrances. Ticket transfer or misuse may lead to refusal of entry.') },
    { title: t('legal.terms.s4Title', 'Payments'), text: t('legal.terms.s4Text', 'Paid events may use mobile money payment providers. A registration for a paid event becomes confirmed only when the payment is successfully verified.') },
    { title: t('legal.terms.s5Title', 'Moderation and suspension'), text: t('legal.terms.s5Text', 'The platform may moderate events, suspend accounts, remove content or restrict access when there is fraud, abuse, policy violation or security risk.') },
  ]

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-teal-900/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><FileText className="h-4 w-4" /> {t('legal.badge', 'Legal')}</span>
          <h1 className="mt-5 text-4xl font-black md:text-6xl">{t('legal.terms.title', 'Terms of Service')}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">{t('legal.terms.intro', { app: APP_NAME, defaultValue: 'These terms explain the rules for using {{app}} as an attendee, organizer or administrator.' })}</p>
        </div>
      </section>

      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-5">
            <Card>
              <h2 className="text-2xl font-black text-slate-950">{t('legal.terms.agreementTitle', 'Agreement to the terms')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.terms.agreementText', { app: APP_NAME, defaultValue: 'By creating an account, publishing an event, registering for an event, buying a ticket or using {{app}}, you agree to respect these Terms of Service and all applicable laws in Cameroon.' })}</p>
            </Card>
            {sections.map((section) => <Card key={section.title}><h2 className="text-xl font-black text-slate-950">{section.title}</h2><p className="mt-3 leading-7 text-slate-600">{section.text}</p></Card>)}
            <Card>
              <h2 className="text-xl font-black text-slate-950">{t('legal.terms.changesTitle', 'Changes to these terms')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.terms.changesText', 'We may update these terms as the platform evolves. Important updates may be communicated through email, in-app notifications or public announcements.')}</p>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-slate-950">{t('legal.terms.s6Title', 'Intellectual property')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.terms.s6Text', 'All platform content, branding, logos, and software are the property of Mboa Events 237 or its licensors. Organizers retain ownership of their event content, images, and descriptions. You grant us a limited license to display your content for the purpose of operating the platform. You may not copy, redistribute, or scrape platform data without written permission.')}</p>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-slate-950">{t('legal.terms.s7Title', 'Limitation of liability')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.terms.s7Text', 'Mboa Events 237 is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability for any claim is limited to the amount you have paid us through the platform in the preceding 12 months. We are not responsible for the conduct of organizers or attendees, or for events that are cancelled, rescheduled, or do not meet expectations.')}</p>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-slate-950">{t('legal.terms.s8Title', 'Governing law')}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t('legal.terms.s8Text', 'These terms are governed by the laws of the Republic of Cameroon. Any disputes arising from your use of the platform shall be resolved in the courts of Cameroon. We will make reasonable efforts to resolve disputes informally before legal action.')}</p>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <ShieldCheck className="h-8 w-8 text-teal-700" />
              <h2 className="mt-4 text-xl font-black text-slate-950">{t('legal.terms.needHelpTitle', 'Need help?')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('legal.terms.needHelpText', 'For questions about these terms, contact support.')}</p>
              <a href="mailto:support@mboaevents237.cm" className="mt-4 block font-bold text-teal-700">support@mboaevents237.cm</a>
              <div className="mt-5 grid gap-2"><Link to="/privacy-policy"><Button variant="secondary" className="w-full">{t('legal.privacy.title', 'Privacy Policy')}</Button></Link><Link to="/events"><Button className="w-full"><Ticket className="mr-2 h-4 w-4" />{t('browseEvents', 'Browse Events')}</Button></Link></div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
