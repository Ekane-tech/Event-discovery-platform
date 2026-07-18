import { toast } from 'sonner'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import { ROLES } from '../../../shared/constants/roles.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useBookmarks } from '../../bookmarks/hooks/useBookmarks.js'
import { useRegistrations } from '../../registrations/hooks/useRegistrations.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import ReportEventModal from '../../reports/components/ReportEventModal.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function canCancelRegistration(event, registration) {
  return event?.status === 'published'
    && event?.visibility === 'public'
    && registration?.status === 'confirmed'
    && !registration?.checkedInAt
}

export default function EventActionPanel({ event }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { isRegistered, getRegistration, registerForEvent, cancelRegistration } = useRegistrations()
  const ticketOptions = useMemo(() => {
    if (event.ticketTypes?.length) return event.ticketTypes.filter((ticket) => ticket.isActive !== false)
    return [{ id: null, name: Number(event.price || 0) > 0 ? 'Classic' : 'Free', description: 'Standard access', price: Number(event.price || 0) }]
  }, [event])
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState(ticketOptions[0]?.id ? String(ticketOptions[0].id) : '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  const bookmarked = isBookmarked(event.id)
  const registration = getRegistration(event.id)
  const registered = isRegistered(event.id)
  const cancellationAllowed = canCancelRegistration(event, registration)
  const selectedTicket = ticketOptions.find((ticket) => String(ticket.id || '') === String(selectedTicketTypeId)) || ticketOptions[0]

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
      const nextRegistration = await registerForEvent(event, selectedTicket?.id ? { ticket_type_id: selectedTicket.id } : {})
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
        <div className="mt-4"><Alert type="success">{t('eventAction.registeredMessage', { ticketNumber: registration.ticketNumber })}{registration.ticketType?.name ? ` (${registration.ticketType.name})` : ''}</Alert></div>
      )}
      {registration && !registered && registration.status === 'cancelled_by_event' && (
        <div className="mt-4"><Alert type="info">{t('eventAction.registrationCancelled')}</Alert></div>
      )}

      {!registered && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-slate-800">Choose ticket type</p>
          <div className="grid gap-3">
            {ticketOptions.map((ticket) => {
              const active = String(ticket.id || '') === String(selectedTicketTypeId)
              return (
                <button key={ticket.id || ticket.name} type="button" onClick={() => setSelectedTicketTypeId(ticket.id ? String(ticket.id) : '')} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-black text-slate-950">{ticket.name}</p><p className="mt-1 text-sm text-slate-600">{ticket.description || 'Event access'}</p></div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-800">{formatPrice(ticket.price)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {registered ? (
          <>
            <Link to={`/tickets/${event.id}`}><Button disabled={busy}>{t('eventAction.viewTicket')}</Button></Link>
            {cancellationAllowed && <Button type="button" variant="danger" disabled={busy} onClick={handleCancelRegistration}>{t('eventAction.cancelRegistration')}</Button>}
          </>
        ) : (
          <Button type="button" disabled={busy} onClick={handleRegister}>{busy ? t('eventAction.processing') : `Register - ${formatPrice(selectedTicket?.price || 0)}`}</Button>
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
