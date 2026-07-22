import { CalendarDays, CheckCircle2, CreditCard, MapPin, Ticket } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { normalizeEvent } from '../../events/utils/normalizeEvent.js'
import { registrationService } from '../services/registrationService.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function normalizeRegistration(apiRegistration) {
  return {
    id: apiRegistration.id,
    status: apiRegistration.status,
    ticketNumber: apiRegistration.ticket_number,
    registrationDate: apiRegistration.registered_at || apiRegistration.created_at,
    checkedInAt: apiRegistration.checked_in_at || null,
    checkedInBy: apiRegistration.checked_in_by_user?.name || apiRegistration.checked_in_by || '',
    payment: apiRegistration.payment || null,
    event: normalizeEvent(apiRegistration.event),
  }
}

export default function RegistrationDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function run() {
      try {
        const response = await registrationService.getRegistration(id)
        setRegistration(normalizeRegistration(response.data.registration))
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, t('registration.loadError', 'Unable to load registration.')))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) return <PageContainer><Loader message={t('registration.loading', 'Loading registration details...')} /></PageContainer>
  if (error) return <PageContainer><ErrorState title={t('registration.errorTitle', 'Registration error')} message={error} /></PageContainer>
  if (!registration?.event) return <PageContainer><EmptyState title={t('registration.notFoundTitle', 'Registration not found')} message={t('registration.notFoundMessage', 'You are not registered for this event.')} /></PageContainer>

  const event = registration.event

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(${event.coverImage?.url || event.categoryImageUrl || '/hero-events.svg'})` }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Ticket className="h-4 w-4" /> {t('registration.badge', 'Registration')}</span>
        <h1 className="mt-5 text-4xl font-black">{event.title}</h1>
        <p className="mt-3 text-slate-200">{t('registration.ticketPrefix', 'Ticket')} {registration.ticketNumber}</p>
      </section>

      {registration.checkedInAt && (
        <div className="mt-6 rounded-3xl border border-teal-100 bg-teal-50 p-5 text-teal-900">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <h2 className="font-black">{t('registration.checkedInTitle', 'You are checked in')}</h2>
              <p className="mt-1 text-sm">{t('registration.checkedInOn', 'Checked in on')} {formatDate(registration.checkedInAt)}{registration.checkedInBy ? ` ${t('registration.by', 'by')} ${registration.checkedInBy}` : ''}.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-xl font-black text-slate-950">{t('registration.infoTitle', 'Registration information')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <p><strong>{t('registration.statusLabel', 'Status:')}</strong><br />{registration.checkedInAt ? t('registrations.checkedIn', 'checked in') : registration.status}</p>
            <p><strong>{t('registration.registeredLabel', 'Registered:')}</strong><br />{formatDate(registration.registrationDate)}</p>
            <p className="flex gap-2"><CalendarDays className="h-5 w-5 text-teal-700" /><span><strong>{t('registration.eventDateLabel', 'Event date:')}</strong><br />{formatDate(event.startDate)}</span></p>
            <p className="flex gap-2"><MapPin className="h-5 w-5 text-teal-700" /><span><strong>{t('registration.locationLabel', 'Location:')}</strong><br />{event.venue}, {event.city}, {event.region}</span></p>
            <p><strong>{t('registration.organizerLabel', 'Organizer:')}</strong><br />{event.organizer}</p>
            <p><strong>{t('registration.priceLabel', 'Price:')}</strong><br />{formatPrice(event.price)}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-slate-950">{t('registration.paymentTitle', 'Payment')}</h2>
          {registration.payment ? (
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p><strong>{t('registration.statusLabel', 'Status:')}</strong> {registration.payment.status}</p>
              <p><strong>{t('registration.amountLabel', 'Amount:')}</strong> {formatPrice(registration.payment.amount)}</p>
              <p><strong>{t('registration.referenceLabel', 'Reference:')}</strong> {registration.payment.reference}</p>
              {['pending', 'processing'].includes(registration.payment.status) && <Link to={`/payments/${registration.payment.id}`}><Button className="mt-2 w-full"><CreditCard className="mr-2 h-4 w-4" /> {t('registration.completePayment', 'Complete Payment')}</Button></Link>}
            </div>
          ) : <p className="mt-4 text-sm text-slate-600">{t('registration.noPayment', 'No payment required for this registration.')}</p>}
          <div className="mt-6 grid gap-2"><Link to={`/tickets/${event.id}`}><Button>{t('registration.viewTicket', 'View Ticket')}</Button></Link><Link to="/registrations"><Button variant="secondary">{t('registration.back', 'Back to registrations')}</Button></Link></div>
        </Card>
      </div>
    </PageContainer>
  )
}
