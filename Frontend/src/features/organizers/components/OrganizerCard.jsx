import { BadgeCheck, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import Button from '../../../shared/components/ui/Button.jsx'

export default function OrganizerCard({ organizer }) {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <Avatar name={organizer.displayName} src={organizer.avatar} className="h-16 w-16 text-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-black text-slate-950">{organizer.displayName}</h2>
            {organizer.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-xs font-black text-teal-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">{organizer.name}</p>
          {(organizer.city || organizer.region) && <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-teal-700" />{organizer.city}{organizer.city && organizer.region ? ', ' : ''}{organizer.region}</p>}
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{organizer.bio || 'Organizer on Mboa Events 237.'}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"><CalendarDays className="h-3.5 w-3.5" />{organizer.publishedEventsCount} events</span>
            <Link to={`/organizers/${organizer.id}`}><Button variant="secondary">View profile</Button></Link>
          </div>
        </div>
      </div>
    </article>
  )
}
