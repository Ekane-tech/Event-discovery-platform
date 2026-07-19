import { toast } from 'sonner'
import { Download, QrCode, UserCheck } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { eventService } from '../../../events/services/eventService.js'
import { extractCollection, normalizeEvent } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function normalizeAttendee(registration) {
  return {
    id: registration.id,
    name: registration.user?.name || 'Unknown attendee',
    email: registration.user?.email || '—',
    phone: registration.user?.profile?.phone || '—',
    city: registration.user?.profile?.city || '—',
    ticket: registration.ticket_number,
    status: registration.status,
    checkedInAt: registration.checked_in_at,
    checkedInLabel: registration.checked_in_at ? formatDate(registration.checked_in_at) : 'Not checked in',
    registeredAt: formatDate(registration.registered_at || registration.created_at),
  }
}

export default function OrganizerAttendeesPage() {
  const { id } = useParams()
  const location = useLocation()
  const [event, setEvent] = useState(null)
  const [summary, setSummary] = useState({})
  const [attendees, setAttendees] = useState([])
  const [ticketQuery, setTicketQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  async function fetchAttendees() {
    setLoading(true)
    setError('')
    try {
      const response = await eventService.getOrganizerEventAttendees(id, { per_page: 100 })
      setEvent(normalizeEvent(response.data.event))
      setSummary(response.data.summary || {})
      setAttendees(extractCollection(response.data, 'attendees').map(normalizeAttendee))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load attendees.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAttendees() }, [id])

  const filteredAttendees = useMemo(() => {
    const keyword = ticketQuery.trim().toLowerCase()
    if (!keyword) return attendees
    return attendees.filter((attendee) => [attendee.ticket, attendee.name, attendee.email].some((value) => String(value || '').toLowerCase().includes(keyword)))
  }, [attendees, ticketQuery])

  async function handleCheckIn(registrationId) {
    setCheckingIn(registrationId)
    try {
      await eventService.checkInRegistration(registrationId)
      toast.success('Attendee checked in.')
      await fetchAttendees()
    } catch (checkInError) {
      toast.error(getApiErrorMessage(checkInError, 'Unable to check in attendee.'))
    } finally {
      setCheckingIn(null)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const response = await eventService.exportOrganizerEventAttendees(id)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `attendees-event-${id}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Attendee CSV downloaded.')
    } catch (exportError) {
      toast.error(getApiErrorMessage(exportError, 'Unable to export attendees.'))
    } finally {
      setExporting(false)
    }
  }

  const isAdminPath = location.pathname.startsWith('/admin')
  const scannerPath = isAdminPath ? `/admin/events/${id}/scanner` : `/organizer/events/${id}/scanner`
  const backPath = isAdminPath ? '/admin/events' : '/organizer/events'

  if (loading) return <PageContainer><Loader message="Loading attendees..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Unable to load attendees" message={error} /></PageContainer>
  if (!event) return <PageContainer><EmptyState title="Event not found" message="The organizer event could not be found." /></PageContainer>

  const rows = filteredAttendees.map((attendee) => ({
    ...attendee,
    checkIn: attendee.checkedInAt ? <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">Checked in</span> : <Button type="button" variant="secondary" className="!px-3 !py-1.5 text-xs" disabled={checkingIn === attendee.id} onClick={() => handleCheckIn(attendee.id)}><UserCheck className="mr-1 h-3.5 w-3.5" />Check in</Button>,
  }))

  return (
    <PageContainer>
      <SectionHeader
        title="Manage Attendees"
        description={`Attendee list, CSV export and check-in workflow for ${event.title}.`}
        action={<div className="flex flex-wrap gap-2"><Link to={scannerPath}><Button><QrCode className="mr-2 h-4 w-4" />Open scanner</Button></Link><Link to={backPath}><Button variant="secondary">Back to Events</Button></Link></div>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {[
          ['Total registrations', summary.registrations_count || 0, 'from-teal-600 to-emerald-700'],
          ['Confirmed', summary.confirmed_count || 0, 'from-blue-600 to-indigo-700'],
          ['Checked in', summary.checked_in_count || 0, 'from-green-600 to-teal-700'],
          ['Cancelled', summary.cancelled_count || 0, 'from-rose-600 to-pink-700'],
          ['Available places', summary.available_places ?? 'Unlimited', 'from-amber-500 to-orange-700'],
        ].map(([label, value, gradient]) => (
          <div key={label} className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}>
            <p className="text-sm text-white/80">{label}</p><p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Ticket scanning workflow</h2>
            <p className="text-sm text-slate-600">Search by ticket, attendee name or email. QR codes open the ticket verification page; organizers can check in from this list.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={ticketQuery} onChange={(event) => setTicketQuery(event.target.value)} placeholder="Search ticket or attendee" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-500" />
            <Button type="button" variant="secondary" onClick={handleExport} disabled={exporting}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          </div>
        </div>
      </Card>

      {attendees.length === 0 ? (
        <EmptyState title="No attendees yet" message="Attendee data will appear here when users register for this event." />
      ) : (
        <Table
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'ticket', label: 'Ticket' },
            { key: 'status', label: 'Status' },
            { key: 'checkedInLabel', label: 'Checked in' },
            { key: 'registeredAt', label: 'Registered' },
            { key: 'checkIn', label: 'Action' },
          ]}
          rows={rows.map((row) => ({
            ...row,
            ticket: <span className="inline-flex items-center gap-1 font-mono text-xs"><QrCode className="h-3.5 w-3.5 text-teal-700" />{row.ticket}</span>,
          }))}
        />
      )}
    </PageContainer>
  )
}
