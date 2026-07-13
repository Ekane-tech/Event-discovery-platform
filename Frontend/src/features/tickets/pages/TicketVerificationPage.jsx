import { CheckCircle2, QrCode, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { ticketService } from '../services/ticketService.js'

export default function TicketVerificationPage() {
  const { ticketNumber } = useParams()
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function verifyTicket() {
      setLoading(true)
      setError('')
      try {
        const response = await ticketService.verifyTicket(ticketNumber)
        setVerification(response.data)
      } catch (verifyError) {
        if (verifyError.response?.data) {
          setVerification(verifyError.response.data)
        } else {
          setError('Unable to verify ticket.')
        }
      } finally {
        setLoading(false)
      }
    }
    verifyTicket()
  }, [ticketNumber])

  if (loading) return <PageContainer><Loader message="Verifying ticket..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Verification error" message={error} /></PageContainer>
  if (!verification) return <PageContainer><EmptyState title="Ticket not found" message="We could not verify this ticket." /></PageContainer>

  const valid = verification.valid
  const ticket = verification.ticket
  const StatusIcon = valid ? CheckCircle2 : XCircle

  return (
    <PageContainer>
      <section className={`rounded-3xl p-8 text-white ${valid ? 'bg-gradient-to-r from-green-700 to-teal-700' : 'bg-gradient-to-r from-red-700 to-rose-700'}`}>
        <QrCode className="h-10 w-10 text-white/90" />
        <h1 className="mt-5 text-4xl font-black">Ticket verification</h1>
        <p className="mt-3 max-w-2xl text-white/90">{verification.message}</p>
      </section>

      <Card className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-8 w-8 ${valid ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-slate-500">Ticket number</p>
                <h2 className="text-2xl font-black text-slate-950">{ticket?.ticket_number || ticketNumber}</h2>
              </div>
            </div>

            {ticket && (
              <div className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                <p><strong>Status:</strong> {ticket.status}</p>
                <p><strong>Registered:</strong> {formatDate(ticket.registered_at)}</p>
                <p><strong>Attendee:</strong> {ticket.attendee?.name || 'Unknown'}</p>
                <p><strong>Email:</strong> {ticket.attendee?.email || '—'}</p>
                <p><strong>Event:</strong> {ticket.event?.title || '—'}</p>
                <p><strong>Date:</strong> {formatDate(ticket.event?.start_date)}</p>
                <p><strong>Venue:</strong> {ticket.event?.venue || '—'}</p>
                <p><strong>Location:</strong> {ticket.event?.city || '—'}, {ticket.event?.region || '—'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/events"><Button variant="secondary">Browse Events</Button></Link>
          {ticket?.event?.id && <Link to={`/events/${ticket.event.id}`}><Button>View Event</Button></Link>}
        </div>
      </Card>
    </PageContainer>
  )
}
