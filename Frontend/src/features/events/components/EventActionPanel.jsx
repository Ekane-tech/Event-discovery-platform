import { toast } from 'sonner'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import { ROLES } from '../../../shared/constants/roles.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useBookmarks } from '../../bookmarks/hooks/useBookmarks.js'
import { useRegistrations } from '../../registrations/hooks/useRegistrations.js'
import ReportEventModal from '../../reports/components/ReportEventModal.jsx'

function canCancelRegistration(event, registration) {
  return event?.status === 'published'
    && event?.visibility === 'public'
    && registration?.status === 'confirmed'
}

export default function EventActionPanel({ event }) {
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { isRegistered, getRegistration, registerForEvent, cancelRegistration } = useRegistrations()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const bookmarked = isBookmarked(event.id)
  const registration = getRegistration(event.id)
  const registered = isRegistered(event.id)
  const cancellationAllowed = canCancelRegistration(event, registration)

  async function handleBookmark() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const added = await toggleBookmark(event.id)
      toast.success(added ? 'Event bookmarked successfully.' : 'Bookmark removed successfully.')
      setMessage(added ? 'Event bookmarked successfully.' : 'Bookmark removed successfully.')
    } catch (bookmarkError) {
      const message = getApiErrorMessage(bookmarkError, 'Unable to update bookmark.')
      toast.error(message)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const nextRegistration = await registerForEvent(event)
      if (nextRegistration.payment) {
        toast.info('Payment is required to complete this registration.')
        navigate(`/payments/${nextRegistration.payment.id}`)
        return
      }
      toast.success('Registered successfully.')
      setMessage(`Registered successfully. Ticket: ${nextRegistration.ticketNumber}`)
    } catch (registrationError) {
      const message = getApiErrorMessage(registrationError, 'Unable to register for event.')
      toast.error(message)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCancelRegistration() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await cancelRegistration(event.id)
      toast.success('Registration cancelled successfully.')
      setMessage('Registration cancelled successfully.')
    } catch (cancelError) {
      const message = getApiErrorMessage(cancelError, 'Unable to cancel registration.')
      toast.error(message)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="mt-6">
        <h2 className="font-bold text-slate-950">Interested in this event?</h2>
        <p className="mt-2 text-sm text-slate-600">Login or create an account to bookmark this event, register, and receive notifications.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/login"><Button>Login to register</Button></Link>
          <Link to="/register"><Button variant="secondary">Create account</Button></Link>
        </div>
      </Card>
    )
  }

  if (role !== ROLES.USER) {
    return (
      <Card className="mt-6">
        <h2 className="font-bold text-slate-950">Event actions</h2>
        <div className="mt-4">
          <Alert type="info">Registration, bookmarks, and user reports are available only for registered user accounts. Your current role is <strong>{role}</strong>.</Alert>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {role === ROLES.ORGANIZER && <Link to="/organizer/events"><Button>Go to My Events</Button></Link>}
          {role === ROLES.ADMIN && <Link to="/admin/events"><Button>Moderate Events</Button></Link>}
          <Link to="/events"><Button variant="secondary">Browse Events</Button></Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <h2 className="font-bold text-slate-950">Event actions</h2>

      {error && <div className="mt-4"><Alert type="error">{error}</Alert></div>}
      {message && <div className="mt-4"><Alert type="success">{message}</Alert></div>}
      {registered && registration && (
        <div className="mt-4"><Alert type="success">You are registered for this event. Ticket number: <strong>{registration.ticketNumber}</strong></Alert></div>
      )}
      {registration && !registered && registration.status === 'cancelled_by_event' && (
        <div className="mt-4"><Alert type="info">This event was previously cancelled by the platform. You can register again now that it is available.</Alert></div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {registered ? (
          <>
            <Link to={`/tickets/${event.id}`}><Button disabled={busy}>View Ticket</Button></Link>
            {cancellationAllowed && <Button type="button" variant="danger" disabled={busy} onClick={handleCancelRegistration}>Cancel Registration</Button>}
          </>
        ) : (
          <Button type="button" disabled={busy} onClick={handleRegister}>{busy ? 'Processing...' : 'Register for Event'}</Button>
        )}

        <Button type="button" disabled={busy} variant={bookmarked ? 'outline' : 'secondary'} onClick={handleBookmark}>
          {bookmarked ? 'Remove Bookmark' : 'Bookmark Event'}
        </Button>
        <Button type="button" disabled={busy} variant="outline" onClick={() => setReportOpen(true)}>Report Event</Button>
      </div>

      <ReportEventModal
        open={reportOpen}
        event={event}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => { toast.success('Report submitted successfully.'); setMessage('Report submitted successfully. Our moderation team will review it.') }}
      />
    </Card>
  )
}
