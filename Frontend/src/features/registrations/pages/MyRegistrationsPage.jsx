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

function canCancelRegistration(event) {
  return event?.status === 'published' && event?.visibility === 'public' && event?.registration?.status === 'confirmed'
}

function StatusBadge({ status }) {
  const styles = status === 'confirmed' ? 'bg-green-50 text-green-700' : status === 'pending_payment' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles}`}>{status}</span>
}

export default function MyRegistrationsPage() {
  const { registeredEvents, registrationCount, loading, error, cancelRegistration } = useRegistrations()

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.88), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Ticket className="h-4 w-4" /> Registrations</span>
        <h1 className="mt-5 text-4xl font-black">Your event registrations</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Manage upcoming events, payment status, tickets and registration changes.</p>
        <div className="mt-6"><Link to="/events"><Button className="bg-white text-slate-950 hover:bg-slate-100">Find Events</Button></Link></div>
      </section>

      <div className="mt-6">
        {loading && <Loader message="Loading your registrations..." />}
        {error && <ErrorState title="Unable to load registrations" message={error} />}
        {!loading && !error && registrationCount === 0 && <EmptyState title="No registrations yet" message="Register for events to see your tickets and payment status here." />}
        {!loading && !error && registrationCount > 0 && (
          <div className="grid gap-5">
            {registeredEvents.map((event) => {
              const payment = event.registration.payment
              return (
                <Card key={event.registration.id} className="overflow-hidden p-0">
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="min-h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage?.url || '/hero-events.svg'})` }} />
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-black text-slate-950">{event.title}</h2>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-teal-700" /> {event.city}, {event.region} • {formatDate(event.startDate)} • {formatPrice(event.price)}</p>
                        </div>
                        <StatusBadge status={event.registration.status} />
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <p><strong>Ticket:</strong> {event.registration.ticketNumber}</p>
                        <p><strong>Payment:</strong> {payment ? `${payment.status} (${formatPrice(payment.amount)})` : 'Not required'}</p>
                      </div>
                      {!canCancelRegistration(event) && <p className="mt-3 text-xs text-slate-500">Cancellation is not available for this registration.</p>}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link to={`/registrations/${event.registration.id}`}><Button variant="secondary">Details</Button></Link>
                        <Link to={`/tickets/${event.id}`}><Button><Ticket className="mr-2 h-4 w-4" /> Ticket</Button></Link>
                        {payment?.status === 'pending' || payment?.status === 'processing' ? <Link to={`/payments/${payment.id}`}><Button variant="secondary"><CreditCard className="mr-2 h-4 w-4" /> Pay</Button></Link> : null}
                        {canCancelRegistration(event) && <Button variant="danger" onClick={() => cancelRegistration(event.id)}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>}
                      </div>
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
