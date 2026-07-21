import { BadgeCheck, CalendarDays, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import EventGrid from '../../events/components/EventGrid.jsx'
import { organizerService } from '../services/organizerService.js'
import { normalizeOrganizerProfile } from '../utils/normalizeOrganizer.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

export default function OrganizerPublicProfilePage() {
  const { id } = useParams()
  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOrganizer() {
      setLoading(true)
      setError('')
      try {
        const response = await organizerService.getOrganizer(id)
        const normalized = normalizeOrganizerProfile(response.data)
        setOrganizer(normalized.organizer)
        setEvents(normalized.events)
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, 'Unable to load organizer profile.'))
      } finally {
        setLoading(false)
      }
    }
    fetchOrganizer()
  }, [id])

  if (loading) return <PageContainer><Loader message="Loading organizer profile..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Organizer profile error" message={error} /></PageContainer>
  if (!organizer) return <PageContainer><EmptyState title="Organizer not found" message="This organizer profile is not available." /></PageContainer>

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-teal-900/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={organizer.displayName} src={organizer.avatar} className="h-24 w-24 text-3xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-4xl font-black md:text-6xl">{organizer.displayName}</h1>{organizer.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-teal-300 px-3 py-1 text-xs font-black text-slate-950"><BadgeCheck className="h-4 w-4" />Verified</span>}</div>
                <p className="mt-2 text-slate-200">{organizer.name}</p>
                {(organizer.city || organizer.region) && <p className="mt-3 flex items-center gap-2 text-slate-200"><MapPin className="h-4 w-4" />{organizer.city}{organizer.city && organizer.region ? ', ' : ''}{organizer.region}</p>}
              </div>
            </div>
            <Link to="/organizers"><Button variant="light">All organizers</Button></Link>
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{organizer.bio || 'Organizer on Mboa Events 237.'}</p>
        </div>
      </section>

      <PageContainer>
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div><h2 className="text-3xl font-black text-slate-950">Events by {organizer.displayName}</h2><p className="mt-2 text-slate-600">Browse upcoming public events from this organizer.</p></div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700"><CalendarDays className="h-4 w-4" />{events.length} events</span>
        </div>
        {events.length === 0 ? <EmptyState title="No public events" message="This organizer has no public events right now." /> : <EventGrid events={events} />}
      </PageContainer>
    </div>
  )
}
