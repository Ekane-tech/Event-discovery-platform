import { CalendarDays, CreditCard, Ticket, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function canCancelRegistration(event) {
  return event?.status === 'published' && event?.visibility === 'public' && event?.registration?.status === 'confirmed' && !event?.registration?.checkedInAt
}

function StatusBadge({ status, checkedInAt, t }) {
  if (checkedInAt) return <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{t('registrations.checkedIn', 'Checked in')}</span>
  const styles = status === 'confirmed' ? 'bg-green-50 text-green-700' : status === 'pending_payment' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles}`}>{status}</span>
}

export default function MyRegistrationsPage() {
  const { t } = useTranslation()
  const { registeredEvents, registrationCount, loading, error, cancelRegistration } = useRegistrations()

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.88), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Ticket className="h-4 w-4" /> {t('registrations.badge', 'Registrations')}</span>
        <h1 className="mt-5 text-4xl font-black">{t('registrations.yourRegistrations', 'Your event registrations')}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{t('registrations.subtitle', 'Manage upcoming events, payment status, tickets and registration changes.')}</p>
        <div className="mt-6"><Link to="/events"><Button variant="light">{t('registrations.findEvents', 'Find Events')}</Button></Link></div>
      </section>

      <div className="mt-6">
        {loading && <Loader message={t('registrations.loading', 'Loading your registrations...')} />}
        {error && <ErrorState title={t('registrations.errorTitle', 'Unable to load registrations')} message={error} />}
        {!loading && !error && registrationCount === 0 && <EmptyState title={t('registrations.emptyTitle', 'No registrations yet')} message={t('registrations.emptyMessage', 'Register for events to see your tickets and payment status here.')} />}
        {!loading && !error && registrationCount > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map((event) => {
              const payment = event.registration.payment
              return (
                <Card key={event.registration.id} className="overflow-hidden p-0">
                  <div className="h-24 bg-cover bg-center sm:h-32" style={{ backgroundImage: `url(${event.coverImage?.url || '/hero-events.svg'})` }} />
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-black text-slate-950 leading-tight truncate sm:text-lg">{event.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 sm:text-sm sm:gap-2"><CalendarDays className="h-3.5 w-3.5 text-teal-700 sm:h-4 sm:w-4" /> <span className="truncate">{formatDate(event.startDate)}</span></p>
                      </div>
                      <StatusBadge status={event.registration.status} checkedInAt={event.registration.checkedInAt} t={t} />
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:mt-4 sm:gap-3 sm:text-sm">
                      <p className="truncate"><strong>{t('registrations.ticketLabel', 'Ticket:')}</strong> <span className="break-all">{event.registration.ticketNumber}</span></p>
                      <p><strong>{t('registrations.paymentLabel', 'Payment:')}</strong> {payment ? `${payment.status} (${formatPrice(payment.amount)})` : t('registrations.paymentNotRequired', 'Not required')}</p>
                      {event.registration.checkedInAt && <p><strong>{t('registrations.checkedInLabel', 'Checked in:')}</strong> {formatDate(event.registration.checkedInAt)}</p>}
                    </div>
                    {!canCancelRegistration(event) && <p className="mt-2 text-[10px] text-slate-500 sm:mt-3 sm:text-xs">{t('registrations.cancellationNotAvailable', 'Cancellation is not available for this registration.')}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                      <Link to={`/registrations/${event.registration.id}`} className="flex-1"><Button variant="secondary" className="w-full text-xs sm:text-sm">{t('registrations.details', 'Details')}</Button></Link>
                      <Link to={`/tickets/${event.id}`} className="flex-1"><Button className="w-full text-xs sm:text-sm"><Ticket className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> {t('registrations.ticketButton', 'Ticket')}</Button></Link>
                      {payment?.status === 'pending' || payment?.status === 'processing' ? <Link to={`/payments/${payment.id}`} className="flex-1"><Button variant="secondary" className="w-full text-xs sm:text-sm"><CreditCard className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> {t('registrations.pay', 'Pay')}</Button></Link> : null}
                      {event.registration.checkedInAt && <Link to={`/tickets/${event.id}`} className="flex-1"><Button variant="outline" className="w-full text-xs sm:text-sm">{t('registrations.viewCheckedInTicket', 'View checked-in ticket')}</Button></Link>}
                      {canCancelRegistration(event) && <Button variant="danger" onClick={() => cancelRegistration(event.id)} className="flex-1 text-xs sm:text-sm"><XCircle className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> {t('registrations.cancel', 'Cancel')}</Button>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
