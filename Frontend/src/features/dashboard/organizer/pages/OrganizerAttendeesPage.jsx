import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
    registeredAt: formatDate(registration.registered_at || registration.created_at),
  }
}

export default function OrganizerAttendeesPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [summary, setSummary] = useState({})
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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

    fetchAttendees()
  }, [id])

  if (loading) return <PageContainer><Loader message="Loading attendees..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Unable to load attendees" message={error} /></PageContainer>

  if (!event) {
    return (
      <PageContainer>
        <EmptyState title="Event not found" message="The organizer event could not be found." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Manage Attendees"
        description={`Attendee list and registration summary for ${event.title}.`}
        action={<Link to="/organizer/events"><Button variant="secondary">Back to My Events</Button></Link>}
      />

      <div className="mb-6 grid grid-cols-4 gap-4 md:grid-cols-4">
        {[['Total registrations', summary.registrations_count || 0, 'from-teal-600 to-emerald-700'], ['Confirmed', summary.confirmed_count || 0, 'from-blue-600 to-indigo-700'], ['Cancelled', summary.cancelled_count || 0, 'from-rose-600 to-pink-700'], ['Available places', summary.available_places ?? 'Unlimited', 'from-amber-500 to-orange-700']].map(([label, value, gradient]) => (
          <div key={label} className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}>
            <p className="text-sm text-white/80">{label}</p><p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {attendees.length === 0 ? (
        <EmptyState title="No attendees yet" message="Attendee data will appear here when users register for this event." />
      ) : (
        <Table
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'city', label: 'City' },
            { key: 'ticket', label: 'Ticket' },
            { key: 'status', label: 'Status' },
            { key: 'registeredAt', label: 'Registered' },
          ]}
          rows={attendees}
        />
      )}
    </PageContainer>
  )
}
