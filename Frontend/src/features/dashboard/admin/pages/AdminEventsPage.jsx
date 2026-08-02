import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, FileWarning, Search, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import Table from '../../../shared/components/ui/Table.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Textarea from '../../../shared/components/ui/Textarea.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import AdminHero from '../components/AdminHero.jsx'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

const MODERATION_CONFIG = {
  published: {
    title: 'Publish event',
    icon: CheckCircle2,
    gradient: 'from-green-600 to-teal-700',
    button: 'Confirm publishing',
    note: 'This event will become visible in public search and attendees will be able to register.',
    requiresReason: false,
  },
  rejected: {
    title: 'Reject event',
    icon: FileWarning,
    gradient: 'from-amber-500 to-orange-700',
    button: 'Confirm rejection',
    note: 'This event will not be visible publicly. The organizer will receive your reason.',
    requiresReason: true,
  },
  cancelled: {
    title: 'Cancel event',
    icon: XCircle,
    gradient: 'from-red-600 to-rose-700',
    button: 'Confirm cancellation',
    note: 'This removes the event from public access, clears bookmarks, updates registrations, and notifies affected users.',
    requiresReason: true,
  },
}

function ModerationModal({ moderation, submitting, onClose, onSubmit, onReasonChange, t }) {
  const config = MODERATION_CONFIG[moderation.status] || MODERATION_CONFIG.published
  const Icon = config.icon
  const reasonIsMissing = config.requiresReason && !moderation.reason.trim()

  return (
    <Modal open={moderation.open} title={t(`admin.events.moderation.${moderation.status}Title`, config.title)} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className={`overflow-hidden rounded-3xl bg-gradient-to-br ${config.gradient} p-5 text-white`}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-white/80">{t('admin.events.moderation.moderationAction', 'Moderation action')}</p>
              <h3 className="mt-1 text-2xl font-black">{t(`admin.events.moderation.${moderation.status}Title`, config.title)}</h3>
              <p className="mt-2 text-sm leading-6 text-white/90">{t(`admin.events.moderation.${moderation.status}Note`, config.note)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('admin.common.event', 'Event')}</p>
          <p className="mt-1 font-black text-slate-950">{moderation.event?.title}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{t('admin.common.current', 'Current')}: {moderation.event?.status}</span>
            <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-700">{t('admin.common.new', 'New')}: {moderation.status}</span>
          </div>
        </div>

        {config.requiresReason && (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">{t('admin.events.moderation.reasonSentToOrganizer', 'Reason sent to organizer')}</span>
            <Textarea
              value={moderation.reason}
              onChange={onReasonChange}
              rows="5"
              placeholder={t('admin.events.moderation.reasonHelper', 'Explain clearly why this moderation action is being applied.')}
              required
            />
            <p className="mt-1 text-xs text-slate-500">{t('admin.events.moderation.reasonHelper', 'This message helps the organizer correct the event and avoid confusion.')}</p>
          </label>
        )}

        {!config.requiresReason && (
          <Alert type="info">{t('admin.events.moderation.publishingNote', 'Publishing does not require a reason. The organizer will be notified that the event is live.')}</Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>{t('admin.common.close', 'Close')}</Button>
          <Button type="submit" variant={moderation.status === 'cancelled' ? 'danger' : 'primary'} disabled={submitting || reasonIsMissing}>
            {submitting ? t('admin.common.saving', 'Saving...') : t(`admin.events.moderation.${moderation.status}Button`, config.button)}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminEventsPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: 'all' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moderation, setModeration] = useState({ open: false, event: null, status: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)

  function buildParams() {
    const params = { per_page: 50 }
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim()
    if (filters.status !== 'all') params.status = filters.status
    return params
  }

  async function fetchEvents() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getEvents(buildParams())
      setEvents(normalizeEvents(extractCollection(response.data, 'events')))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, t('admin.events.toasts.error.load', 'Unable to load events.')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const metrics = useMemo(() => ({
    total: events.length,
    pending: events.filter((event) => event.status === 'pending').length,
    published: events.filter((event) => event.status === 'published').length,
    flagged: events.filter((event) => event.reports > 0).length,
  }), [events])

  async function applyStatus(event, status, reason = '') {
    setSubmitting(true)
    try {
      await adminService.updateEventStatus(event.id, status, reason)
      toast.success(t(`admin.events.toasts.${status}`, `Event ${status} successfully.`))
      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status } : item))
      await fetchEvents()
    } catch (statusError) {
      const message = getApiErrorMessage(statusError, t('admin.events.toasts.error.statusUpdate', 'Unable to update event status.'))
      toast.error(message)
      setError(message)
      await fetchEvents()
    } finally {
      setSubmitting(false)
    }
  }

  function openModeration(event, status) {
    setModeration({ open: true, event, status, reason: '' })
  }

  async function submitModeration(event) {
    event.preventDefault()
    await applyStatus(moderation.event, moderation.status, moderation.reason)
    setModeration({ open: false, event: null, status: '', reason: '' })
  }

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const rows = events.map((event) => ({
    title: <div><p className="font-bold text-slate-950">{event.title}</p><p className="text-xs text-slate-500">#{event.id}</p></div>,
    category: event.category || '—',
    city: event.city || '—',
    date: formatDate(event.startDate),
    status: <AdminStatusBadge status={event.status} />,
    reports: event.reports || 0,
    actions: (
      <AdminPageActions>
        <Link to={`/admin/events/${event.id}/details`}><AdminActionButton><Eye className="mr-1 h-3 w-3" />{t('admin.events.actions.details', 'Details')}</AdminActionButton></Link>
        {event.status !== 'published' && <AdminActionButton onClick={() => openModeration(event, 'published')}>{t('admin.events.actions.publish', 'Publish')}</AdminActionButton>}
        {event.status !== 'rejected' && <AdminActionButton onClick={() => openModeration(event, 'rejected')}>{t('admin.events.actions.reject', 'Reject')}</AdminActionButton>}
        {event.status !== 'cancelled' && <AdminActionButton onClick={() => openModeration(event, 'cancelled')}>{t('admin.events.actions.cancel', 'Cancel')}</AdminActionButton>}
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <AdminHero title={t('admin.events.title', 'Moderate events')} description={t('admin.events.description', 'Review submitted events, publish valid listings, and block problematic content.')} />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white"><p className="text-sm text-white/80">{t('admin.events.totalEvents', 'Total events')}</p><p className="mt-2 text-2xl font-black md:text-3xl">{metrics.total}</p></div>
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-700 p-5 text-white"><p className="text-sm text-white/80">{t('admin.events.pendingEvents', 'Pending')}</p><p className="mt-2 text-2xl font-black md:text-3xl">{metrics.pending}</p></div>
        <div className="rounded-3xl bg-gradient-to-br from-green-600 to-teal-700 p-5 text-white"><p className="text-sm text-white/80">{t('admin.events.publishedEvents', 'Published')}</p><p className="mt-2 text-2xl font-black md:text-3xl">{metrics.published}</p></div>
        <div className="rounded-3xl bg-gradient-to-br from-rose-600 to-pink-700 p-5 text-white"><p className="text-sm text-white/80">{t('admin.events.reportedEvents', 'Reported')}</p><p className="mt-2 text-2xl font-black md:text-3xl">{metrics.flagged}</p></div>
      </div>

      <div className="my-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
        <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder={t('admin.events.searchPlaceholder', 'Search events')} className="pl-10" /></div>
        <Select name="status" value={filters.status} onChange={updateFilter}><option value="all">{t('admin.events.statusFilter.all', 'All statuses')}</option><option value="pending">{t('admin.events.statusFilter.pending', 'Pending')}</option><option value="published">{t('admin.events.statusFilter.published', 'Published')}</option><option value="rejected">{t('admin.events.statusFilter.rejected', 'Rejected')}</option><option value="cancelled">{t('admin.events.statusFilter.cancelled', 'Cancelled')}</option><option value="draft">{t('admin.events.statusFilter.draft', 'Draft')}</option></Select>
        <Button onClick={fetchEvents}>{t('admin.common.search', 'Search')}</Button>
      </div>

      {loading && <Loader message={t('admin.common.loading', { type: t('admin.events.title', 'events') }, 'Loading events...')} />}
      {error && <div className="mb-6"><ErrorState title={t('admin.common.errorTitle', 'Error')} message={error} /></div>}
      {!loading && <Table columns={[{ key: 'title', label: t('admin.events.table.title', 'Event') }, { key: 'category', label: t('admin.events.table.category', 'Category') }, { key: 'city', label: t('admin.events.table.city', 'City') }, { key: 'date', label: t('admin.events.table.date', 'Date') }, { key: 'status', label: t('admin.events.table.status', 'Status') }, { key: 'reports', label: t('admin.events.table.reports', 'Reports') }, { key: 'actions', label: t('admin.common.actions', 'Actions') }]} rows={rows} />}

      <ModerationModal
        moderation={moderation}
        submitting={submitting}
        onClose={() => setModeration({ open: false, event: null, status: '', reason: '' })}
        onSubmit={submitModeration}
        onReasonChange={(inputEvent) => setModeration((current) => ({ ...current, reason: inputEvent.target.value }))}
        t={t}
      />
    </PageContainer>
  )
}
