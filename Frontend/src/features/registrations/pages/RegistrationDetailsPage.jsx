import { CalendarDays, CreditCard, MapPin, Ticket } from 'lucide-react'
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

function normalizeRegistration(apiRegistration) {
  return { id: apiRegistration.id, status: apiRegistration.status, ticketNumber: apiRegistration.ticket_number, registrationDate: apiRegistration.registered_at || apiRegistration.created_at, payment: apiRegistration.payment || null, event: normalizeEvent(apiRegistration.event) }
}

export default function RegistrationDetailsPage() {
  const { id } = useParams()
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { async function run(){ try{ const r=await registrationService.getRegistration(id); setRegistration(normalizeRegistration(r.data.registration)) }catch(e){ setError(getApiErrorMessage(e,'Unable to load registration.')) }finally{ setLoading(false) } } run() }, [id])
  if (loading) return <PageContainer><Loader message="Loading registration details..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Registration error" message={error} /></PageContainer>
  if (!registration?.event) return <PageContainer><EmptyState title="Registration not found" message="You are not registered for this event." /></PageContainer>
  const event = registration.event
  return <PageContainer><section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{backgroundImage:`linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(${event.coverImage?.url || '/hero-events.svg'})`}}><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><Ticket className="h-4 w-4"/> Registration</span><h1 className="mt-5 text-4xl font-black">{event.title}</h1><p className="mt-3 text-slate-200">Ticket {registration.ticketNumber}</p></section><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]"><Card><h2 className="text-xl font-black text-slate-950">Registration information</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><p><strong>Status:</strong><br/>{registration.status}</p><p><strong>Registered:</strong><br/>{formatDate(registration.registrationDate)}</p><p className="flex gap-2"><CalendarDays className="h-5 w-5 text-teal-700"/><span><strong>Event date:</strong><br/>{formatDate(event.startDate)}</span></p><p className="flex gap-2"><MapPin className="h-5 w-5 text-teal-700"/><span><strong>Location:</strong><br/>{event.venue}, {event.city}, {event.region}</span></p><p><strong>Organizer:</strong><br/>{event.organizer}</p><p><strong>Price:</strong><br/>{formatPrice(event.price)}</p></div></Card><Card><h2 className="text-xl font-black text-slate-950">Payment</h2>{registration.payment ? <div className="mt-4 grid gap-3 text-sm text-slate-600"><p><strong>Status:</strong> {registration.payment.status}</p><p><strong>Amount:</strong> {formatPrice(registration.payment.amount)}</p><p><strong>Reference:</strong> {registration.payment.reference}</p>{['pending','processing'].includes(registration.payment.status)&&<Link to={`/payments/${registration.payment.id}`}><Button className="mt-2 w-full"><CreditCard className="mr-2 h-4 w-4"/> Complete Payment</Button></Link>}</div> : <p className="mt-4 text-sm text-slate-600">No payment required for this registration.</p>}<div className="mt-6 grid gap-2"><Link to={`/tickets/${event.id}`}><Button>View Ticket</Button></Link><Link to="/registrations"><Button variant="secondary">Back to registrations</Button></Link></div></Card></div></PageContainer>
}
