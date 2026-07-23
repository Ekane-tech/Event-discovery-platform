import { CalendarDays, Clock, Copy, Eye, MapPin, Ticket, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import OrganizerEventStatusBadge from './OrganizerEventStatusBadge.jsx'
import { hasEventEnded } from '../utils/eventLifecycle.js'

export default function OrganizerEventCard({ event, onDelete, onDuplicate }) {
  const cover = event.coverImage?.url || event.categoryImageUrl || '/hero-events.svg'
  const isPast = hasEventEnded(event)

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="grid lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr]">
        <div className="relative h-52 bg-slate-100 sm:h-60 lg:h-auto lg:min-h-full">
          <img src={cover} alt={event.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent lg:hidden" />
        </div>

        <div className="min-w-0 p-5 lg:p-6">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <OrganizerEventStatusBadge status={event.status} />
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{event.category || 'Event'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 capitalize">{event.visibility}</span>
                {isPast && <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-wide text-white"><Clock className="h-3 w-3" /> Past</span>}
              </div>

              <h2 className="max-w-3xl break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl md:text-3xl">{event.title}</h2>
              <p className="mt-3 line-clamp-3 max-w-4xl text-sm leading-6 text-slate-600">{event.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600 lg:grid-cols-2">
                <p className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <span><strong className="text-slate-800">Venue:</strong><br />{event.venue || 'No venue'}{event.city ? `, ${event.city}` : ''}{event.region ? `, ${event.region}` : ''}</span>
                </p>
                <p className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <span><strong className="text-slate-800">Date:</strong><br />{formatDate(event.startDate)}</span>
                </p>
                <p className="rounded-2xl bg-slate-50 p-3"><strong className="text-slate-800">Price:</strong><br />{formatPrice(event.price)}</p>
                <p className="rounded-2xl bg-slate-50 p-3"><strong className="text-slate-800">Capacity:</strong><br />{event.maximumParticipants || 'Unlimited'}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><Ticket className="h-3 w-3" /> {event.registrations || 0} registrations</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><Eye className="h-3 w-3" /> {event.views || 0} views</span>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap 2xl:max-w-[360px] 2xl:justify-end">
              <Link to={`/organizer/events/${event.id}/details`}><Button variant="secondary" className="w-full sm:w-auto">Details</Button></Link>
              <Link to={`/organizer/events/${event.id}/attendees`}><Button variant="secondary" className="w-full sm:w-auto">Attendees</Button></Link>
              <Link to={`/organizer/events/${event.id}/scanner`}><Button variant="secondary" className="w-full sm:w-auto">Scanner</Button></Link>
              {!isPast && <Link to={`/organizer/events/${event.id}/edit`}><Button className="w-full sm:w-auto">Edit</Button></Link>}
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onDuplicate(event.id)}><Copy className="mr-2 h-4 w-4" />{isPast ? 'Duplicate for new date' : 'Duplicate'}</Button>
              <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={() => onDelete(event.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
