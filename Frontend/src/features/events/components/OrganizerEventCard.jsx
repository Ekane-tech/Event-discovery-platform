import { CalendarDays, Eye, MapPin, Ticket, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import OrganizerEventStatusBadge from './OrganizerEventStatusBadge.jsx'

export default function OrganizerEventCard({ event, onDelete }) {
  const cover = event.coverImage?.url || '/hero-events.svg'

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <div className="min-h-64 bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} />
        <div className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <OrganizerEventStatusBadge status={event.status} />
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{event.category || 'Event'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 capitalize">{event.visibility}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-950">{event.title}</h2>
              <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">{event.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p className="flex gap-2"><MapPin className="h-4 w-4 text-teal-700" /> {event.venue || 'No venue'}, {event.city || 'No city'}, {event.region || 'No region'}</p>
                <p className="flex gap-2"><CalendarDays className="h-4 w-4 text-teal-700" /> {formatDate(event.startDate)}</p>
                <p><strong>Price:</strong> {formatPrice(event.price)}</p>
                <p><strong>Capacity:</strong> {event.maximumParticipants || 'Unlimited'}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><Ticket className="h-3 w-3" /> {event.registrations || 0} registrations</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><Eye className="h-3 w-3" /> {event.views || 0} views</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Publishing and rejection are handled by administrators.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to={`/organizer/events/${event.id}/details`}><Button variant="secondary">Details</Button></Link>
              <Link to={`/organizer/events/${event.id}/attendees`}><Button variant="secondary">Attendees</Button></Link>
              <Link to={`/organizer/events/${event.id}/edit`}><Button>Edit</Button></Link>
              <Button type="button" variant="danger" onClick={() => onDelete(event.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
