import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import EmptyState from '../../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../../shared/utils/currency.js'
import { eventService } from '../../../events/services/eventService.js'
import { normalizeEvent } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

export default function OrganizerEventDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const isAdminView = location.pathname.startsWith('/admin')
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await eventService.getOrganizerEvent(id)
        setEvent(normalizeEvent(response.data.event))
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, 'Unable to load event details.'))
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id])

  if (loading) return <PageContainer><Loader message="Loading event performance..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Unable to load event" message={error} /></PageContainer>
  if (!event) return <PageContainer><EmptyState title="Event not found" message="This organizer event could not be found." /></PageContainer>

  const stats = [
    ['Views', event.views || 0],
    ['Registrations', event.registrations || 0],
    ['Bookmarks', event.bookmarks || 0],
    ['Reports', event.reports || 0],
    ['Capacity', event.maximumParticipants || 'Unlimited'],
    ['Revenue potential', formatPrice((event.price || 0) * (event.registrations || 0))],
  ]

  return (
    <PageContainer>
      <SectionHeader title={event.title} description="Organizer event details and performance overview." action={<Link to={isAdminView ? "/admin/events" : "/organizer/events"}><Button variant="secondary">{isAdminView ? "Back to Admin Events" : "Back to My Events"}</Button></Link>} />
      {event.coverImage && <img src={event.coverImage.url} alt={event.title} className="mb-6 h-72 w-full rounded-2xl object-cover" />}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {stats.map(([label, value], index) => <div key={label} className={`rounded-3xl bg-gradient-to-br ${['from-teal-600 to-emerald-700','from-blue-600 to-indigo-700','from-yellow-500 to-orange-600','from-rose-600 to-pink-700','from-slate-600 to-slate-800','from-purple-600 to-violet-800'][index]} p-5 text-white shadow-sm`}><p className="text-sm text-white/80">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
      </div>
      <Card className="mt-6">
        <h2 className="font-bold text-slate-950">Event information</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p><strong>Status:</strong> {event.status}</p><p><strong>Visibility:</strong> {event.visibility}</p>
          <p><strong>Category:</strong> {event.category}</p><p><strong>Organizer:</strong> {event.organizer}</p>
          <p><strong>Location:</strong> {event.venue}, {event.city}, {event.region}</p><p><strong>Date:</strong> {formatDate(event.startDate)}</p>
          <p><strong>Price:</strong> {formatPrice(event.price)}</p><p><strong>Registration deadline:</strong> {formatDate(event.registrationDeadline)}</p>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{event.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">{!isAdminView && <Link to={`/organizer/events/${event.id}/edit`}><Button>Edit Event</Button></Link>}<Link to={isAdminView ? `/admin/events/${event.id}/attendees` : `/organizer/events/${event.id}/attendees`}><Button variant="secondary">View Attendees</Button></Link></div>
      </Card>
    </PageContainer>
  )
}
