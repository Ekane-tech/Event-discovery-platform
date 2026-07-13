import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Modal from '../../../../shared/components/ui/Modal.jsx'
import Textarea from '../../../../shared/components/ui/Textarea.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moderation, setModeration] = useState({ open: false, event: null, status: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)

  async function fetchEvents() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getEvents({ per_page: 50 })
      setEvents(normalizeEvents(extractCollection(response.data, 'events')))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load events.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  async function applyStatus(event, status, reason = '') {
    setSubmitting(true)
    try {
      await adminService.updateEventStatus(event.id, status, reason)
      toast.success(`Event ${status} successfully.`)
      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status } : item))
      await fetchEvents()
    } catch (statusError) {
      const message = getApiErrorMessage(statusError, 'Unable to update event status.')
      toast.error(message)
      setError(message)
      await fetchEvents()
    } finally {
      setSubmitting(false)
    }
  }

  function openModeration(event, status) {
    if (status === 'published') {
      applyStatus(event, status)
      return
    }

    setModeration({ open: true, event, status, reason: '' })
  }

  async function submitModeration(event) {
    event.preventDefault()
    await applyStatus(moderation.event, moderation.status, moderation.reason)
    setModeration({ open: false, event: null, status: '', reason: '' })
  }

  const rows = events.map((event) => ({
    title: event.title,
    category: event.category || '—',
    city: event.city || '—',
    date: formatDate(event.startDate),
    status: <AdminStatusBadge status={event.status} />,
    reports: event.reports || 0,
    actions: (
      <AdminPageActions>
        <Link to={`/admin/events/${event.id}/details`}><AdminActionButton>Details</AdminActionButton></Link>
        {event.status !== 'published' && <AdminActionButton onClick={() => openModeration(event, 'published')}>Publish</AdminActionButton>}
        {event.status !== 'rejected' && <AdminActionButton onClick={() => openModeration(event, 'rejected')}>Reject</AdminActionButton>}
        {event.status !== 'cancelled' && <AdminActionButton onClick={() => openModeration(event, 'cancelled')}>Cancel</AdminActionButton>}
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <SectionHeader title="Manage Events" description="Moderate submitted events and control public visibility." />
      {loading && <Loader message="Loading events..." />}
      {error && <div className="mb-6"><ErrorState title="Unable to load events" message={error} /></div>}
      {!loading && <Table columns={[{ key: 'title', label: 'Event' }, { key: 'category', label: 'Category' }, { key: 'city', label: 'City' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'reports', label: 'Reports' }, { key: 'actions', label: 'Actions' }]} rows={rows} />}

      <Modal open={moderation.open} title="Moderate event" onClose={() => setModeration({ open: false, event: null, status: '', reason: '' })}>
        <form onSubmit={submitModeration} className="grid gap-4">
          <div>
            <p className="text-sm text-slate-600">Event</p>
            <p className="font-bold text-slate-950">{moderation.event?.title}</p>
            <p className="mt-1 text-sm text-slate-600">New status: <strong>{moderation.status}</strong></p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Moderation reason</span>
            <Textarea value={moderation.reason} onChange={(inputEvent) => setModeration((current) => ({ ...current, reason: inputEvent.target.value }))} rows="5" placeholder="Explain why this status is being applied. This reason will be sent to the organizer." />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModeration({ open: false, event: null, status: '', reason: '' })}>Close</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Confirm moderation'}</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  )
}
