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
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function canCancelRegistration(event, registration) {
  return event?.status === 'published'
    && event?.visibility === 'public'
    && registration?.status === 'confirmed'
}

export default function EventActionPanel({ event }) {
  const { t } = useTranslation()
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
      toast.success(added ? t('eventAction.bookmarkAdded') : t('eventAction.bookmarkRemoved'))
      setMessage(added ? t('eventAction.bookmarkAdded') : t('eventAction.bookmarkRemoved'))
    } catch (bookmarkError) {
      const message = getApiErrorMessage(bookmarkError, t('eventAction.bookmarkUpdateFailed'))
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
        toast.info(t('eventAction.paymentRequired'))
        navigate(`/payments/${nextRegistration.payment.id}`)
        return
      }
      toast.success(t('eventAction.registrationSuccess'))
      setMessage(t('eventAction.registrationSuccessTicket', { ticketNumber: nextRegistration.ticketNumber }))
    } catch (registrationError) {
      const message = getApiErrorMessage(registrationError, t('eventAction.registrationFailed'))
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
      toast.success(t('eventAction.cancelSuccess'))
      setMessage(t('eventAction.cancelSuccess'))
    } catch (cancelError) {
      const message = getApiErrorMessage(cancelError, t('eventAction.cancelFailed'))
      toast.error(message)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="mt-6">
        <h2 className="font-bold text-slate-950">{t('eventAction.interestedTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('eventAction.interestedDescription')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/login"><Button>{t('eventAction.loginToRegister')}</Button></Link>
          <Link to="/register"><Button variant="secondary">{t('createAccount')}</Button></Link>
        </div>
      </Card>
    )
  }

  if (role !== ROLES.USER) {
    return (
      <Card className="mt-6">
        <h2 className="font-bold text-slate-950">{t('eventAction.title')}</h2>
        <div className="mt-4">
          <Alert type="info">{t('eventAction.userRoleInfo', { role })}</Alert>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {role === ROLES.ORGANIZER && <Link to="/organizer/events"><Button>{t('eventAction.goToMyEvents')}</Button></Link>}
          {role === ROLES.ADMIN && <Link to="/admin/events"><Button>{t('eventAction.moderateEvents')}</Button></Link>}
          <Link to="/events"><Button variant="secondary">{t('eventAction.browseEvents')}</Button></Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <h2 className="font-bold text-slate-950">{t('eventAction.title')}</h2>

      {error && <div className="mt-4"><Alert type="error">{error}</Alert></div>}
      {message && <div className="mt-4"><Alert type="success">{message}</Alert></div>}
      {registered && registration && (
        <div className="mt-4"><Alert type="success">{t('eventAction.registeredMessage', { ticketNumber: registration.ticketNumber })}</Alert></div>
      )}
      {registration && !registered && registration.status === 'cancelled_by_event' && (
        <div className="mt-4"><Alert type="info">{t('eventAction.registrationCancelled')}</Alert></div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {registered ? (
          <>
            <Link to={`/tickets/${event.id}`}><Button disabled={busy}>{t('eventAction.viewTicket')}</Button></Link>
            {cancellationAllowed && <Button type="button" variant="danger" disabled={busy} onClick={handleCancelRegistration}>{t('eventAction.cancelRegistration')}</Button>}
          </>
        ) : (
          <Button type="button" disabled={busy} onClick={handleRegister}>{busy ? t('eventAction.processing') : t('eventAction.registerForEvent')}</Button>
        )}

        <Button type="button" disabled={busy} variant={bookmarked ? 'outline' : 'secondary'} onClick={handleBookmark}>
          {bookmarked ? t('eventAction.removeBookmark') : t('eventAction.bookmarkEvent')}
        </Button>
        <Button type="button" disabled={busy} variant="outline" onClick={() => setReportOpen(true)}>{t('eventAction.reportEvent')}</Button>
      </div>

      <ReportEventModal
        open={reportOpen}
        event={event}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => { toast.success(t('eventAction.reportSubmitted')); setMessage(t('eventAction.reportSubmittedReview')) }}
      />
    </Card>
  )
}
