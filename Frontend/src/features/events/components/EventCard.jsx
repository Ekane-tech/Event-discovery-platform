import { AlertTriangle, BadgeCheck, Bookmark, CalendarDays, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useLocation } from 'react-router-dom'
import Badge from '../../../shared/components/ui/Badge.jsx'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { ROLES } from '../../../shared/constants/roles.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useBookmarks } from '../../bookmarks/hooks/useBookmarks.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import { getEventLifecycle } from '../utils/eventLifecycle.js'

export default function EventCard({ event }) {
  const location = useLocation()
  const { isAuthenticated, role } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bg = event.coverImage?.url || event.categoryImageUrl || '/hero-events.svg'
  const bookmarked = isBookmarked(event.id)
  const canBookmark = isAuthenticated && role === ROLES.USER
  const lifecycle = getEventLifecycle(event)

  async function handleBookmark(clickEvent) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    if (!canBookmark) return toast.info('Sign in as an attendee to bookmark events.')
    try {
      const added = await toggleBookmark(event.id)
      toast.success(added ? 'Event bookmarked.' : 'Bookmark removed.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update bookmark.'))
    }
  }

  return (
    <Link to={`/events/${event.id}`} state={{ from: `${location.pathname}${location.search}` }} className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-xl bg-slate-900 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${bg})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-slate-950/5" />
      <button onClick={handleBookmark} className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition ${bookmarked ? 'bg-yellow-400 text-slate-950' : 'bg-white/25 text-white hover:bg-white/40'}`} aria-label="Bookmark event">
        <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
      <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
        {lifecycle.isPast && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
            <Clock className="h-3.5 w-3.5" /> Past event
          </span>
        )}
        {!lifecycle.isPast && lifecycle.registrationDeadlineUrgent && (
          <span className="mboa-deadline-pulse inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-red-950/30 ring-1 ring-white/30">
            <AlertTriangle className="h-3.5 w-3.5" /> Closing soon
          </span>
        )}
      </div>
      <div className="relative flex flex-1 flex-col justify-end p-5 text-white">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="bg-white/20 text-white backdrop-blur">{event.category || 'Event'}</Badge>
          <span className="rounded-full bg-teal-500 px-3 py-1 text-sm font-bold text-white">{formatPrice(event.price)}</span>
        </div>
        <h3 className="text-xl font-black leading-tight drop-shadow-sm">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-100 drop-shadow-sm">{event.description}</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-100">
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-200" /> {event.city || 'Unknown city'}, {event.region || 'Unknown region'}</p>
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-200" /> {formatDate(event.startDate)}</p>
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-2">
            <Link to={event.organizerId ? `/organizers/${event.organizerId}` : '#'} onClick={(clickEvent) => clickEvent.stopPropagation()} className="relative shrink-0">
              <Avatar name={event.organizerName || event.organizer} src={event.organizerAvatar} className="h-9 w-9 text-xs" />
              {event.organizerVerified && (
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white shadow-md">
                  <BadgeCheck className="h-2.5 w-2.5" />
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">Organized by</p>
              <Link to={event.organizerId ? `/organizers/${event.organizerId}` : '#'} onClick={(clickEvent) => clickEvent.stopPropagation()} className="truncate text-sm font-black text-white">
                {event.organizerName || event.organizer || 'Organizer'}
              </Link>
            </div>
          </div>
          <Button className="w-auto rounded-full bg-teal-600 px-5 text-white hover:bg-teal-700">View Details</Button>
        </div>
      </div>
    </Link>
  )
}
