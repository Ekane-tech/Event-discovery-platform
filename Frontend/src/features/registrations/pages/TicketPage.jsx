import { AlertTriangle, CalendarDays, CheckCircle2, MapPin, QrCode, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { APP_NAME } from '../../../shared/constants/app.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { hasEventEnded } from '../../events/utils/eventLifecycle.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function canViewPublicEvent(event, registration) {
  return event?.status === 'published' && event?.visibility === 'public' && !String(registration?.status || '').startsWith('cancelled')
}

export default function TicketPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { getRegistration, loading, error } = useRegistrations()
  const registration = getRegistration(id)
  const event = registration?.event
  const expiredByTime = hasEventEnded(event)
  const available = canViewPublicEvent(event, registration) && !expiredByTime
  const verificationUrl = registration?.ticketNumber
    ? `${window.location.origin}/tickets/verify/${encodeURIComponent(registration.ticketNumber)}`
    : ''

  if (loading) return <PageContainer><Loader message={t('tickets.loading', 'Loading ticket...')} /></PageContainer>
  if (error) return <PageContainer><ErrorState title={t('tickets.errorTitle', 'Ticket error')} message={error} /></PageContainer>
  if (!event || !registration) return <PageContainer><EmptyState title={t('tickets.notFoundTitle', 'Ticket not found')} message={t('tickets.notFoundMessage', 'Register for this event first to generate a ticket.')} /></PageContainer>

  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="bg-slate-950 bg-cover bg-center p-5 text-white sm:p-6 md:p-8" style={{backgroundImage:`linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.7)), url(${event.coverImage?.url || '/hero-events.svg'})`}}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-teal-100"><ShieldCheck className="h-4 w-4"/> {t('tickets.digitalTicket', 'Digital Ticket')}</p>
                <h1 className="mt-4 text-xl font-black sm:text-2xl md:text-3xl">{event.title}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-200 sm:text-base"><CalendarDays className="h-4 w-4"/> {formatDate(event.startDate)}</p>
              </div>
              <div className="shrink-0 rounded-2xl bg-white p-3 text-slate-950 shadow-xl">
                <div className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-black text-teal-700 sm:text-xs"><img src="/applogo.png" alt={APP_NAME} className="h-6 w-6 rounded-lg object-cover sm:h-7 sm:w-7" /> {APP_NAME}</div>
                <QRCodeSVG value={verificationUrl} size={112} level="M" includeMargin />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 md:p-8">
            {registration.checkedInAt && <div className="mb-5"><Alert type="success"><CheckCircle2 className="mr-2 inline h-4 w-4" /> {t('tickets.checkedInMessage', 'You are checked in for this event.')} {t('tickets.checkedInOn', 'Checked in on')} <strong>{formatDate(registration.checkedInAt)}</strong>.</Alert></div>}
            {expiredByTime && <div className="mb-5"><Alert type="warning"><AlertTriangle className="mr-2 inline h-4 w-4" /> {t('tickets.expiredMessage', 'This ticket is no longer valid because the event end time has passed.')}</Alert></div>}
            {!available && !expiredByTime && <div className="mb-5"><Alert type="warning">{t('tickets.notAvailableMessage', { status: registration.status, defaultValue: 'This event is no longer publicly available. Your registration status is {{status}}.' })}</Alert></div>}
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <div><p className="text-xs text-slate-500 md:text-sm">{t('tickets.ticketNumber', 'Ticket number')}</p><p className="mt-1 break-all text-sm font-black tracking-wide text-slate-950 sm:text-lg md:text-2xl">{registration.ticketNumber}</p></div>
              <div><p className="text-xs text-slate-500 md:text-sm">{t('tickets.status', 'Status')}</p><p className="mt-1 text-sm font-black capitalize text-slate-950 sm:text-lg md:text-2xl">{expiredByTime ? t('tickets.expired', 'Expired') : registration.checkedInAt ? t('tickets.checkedIn', 'Checked in') : registration.status}</p></div>
              {registration.ticketType?.name && <div className="col-span-2 md:col-span-1"><p className="text-xs text-slate-500 md:text-sm">{t('tickets.ticketType', 'Ticket type')}</p><p className="mt-1 text-sm font-black capitalize text-slate-950 sm:text-lg md:text-2xl">{registration.ticketType.name}</p></div>}
              <p className="col-span-2 flex gap-2 text-xs text-slate-700 md:col-span-1 md:text-sm"><MapPin className="h-4 w-4 shrink-0 text-teal-700 md:h-5 md:w-5" /> {event.venue}, {event.city}, {event.region}</p>
              <p className="col-span-2 flex gap-2 text-xs text-slate-700 md:col-span-1 md:text-sm"><QrCode className="h-4 w-4 shrink-0 text-teal-700 md:h-5 md:w-5" /> {t('tickets.scanHint', 'Scan this QR code to verify the ticket.')}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2"><Link to="/registrations"><Button>{t('tickets.myRegistrations', 'My registrations')}</Button></Link>{available&&<Link to={`/events/${event.id}`}><Button variant="secondary">{t('tickets.eventDetails', 'Event details')}</Button></Link>}<Link to={`/tickets/verify/${encodeURIComponent(registration.ticketNumber)}`}><Button variant="outline">{t('tickets.verifyTicket', 'Verify ticket')}</Button></Link></div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
