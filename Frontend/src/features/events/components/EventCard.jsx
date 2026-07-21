import { BadgeCheck, Bookmark, CalendarDays, MapPin } from 'lucide-react'
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

export default function EventCard({ event }) {
  const location = useLocation()
  const { isAuthenticated, role } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bg = event.coverImage?.url || event.categoryImageUrl || '/hero-events.svg'
  const bookmarked = isBookmarked(event.id)
  const canBookmark = isAuthenticated && role === ROLES.USER

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
    <article className="group relative min-h-[360px] overflow-hidden rounded-xl bg-slate-900 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${bg})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-slate-950/5" />
      <button onClick={handleBookmark} className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition ${bookmarked ? 'bg-yellow-400 text-slate-950' : 'bg-white/25 text-white hover:bg-white/40'}`} aria-label="Bookmark event">
        <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
      <div className="relative flex min-h-[360px] flex-col justify-end p-5 text-white">
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
        <Link to={event.organizerId ? `/organizers/${event.organizerId}` : '#'} onClick={(clickEvent) => clickEvent.stopPropagation()} className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-2 backdrop-blur transition hover:bg-white/25">
          <Avatar name={event.organizerName || event.organizer} src={event.organizerAvatar} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">Organized by</p>
            <p className="truncate text-sm font-black text-white">{event.organizerName || event.organizer || 'Organizer'}</p>
          </div>
          {event.organizerVerified && <span className="inline-flex items-center gap-1 rounded-full bg-teal-300 px-2 py-1 text-[10px] font-black text-slate-950"><BadgeCheck className="h-3 w-3" />Verified</span>}
        </Link>
        <Link to={`/events/${event.id}`} state={{ from: `${location.pathname}${location.search}` }} className="mt-5">
          <Button className="w-auto rounded-full bg-teal-600 px-5 text-white hover:bg-teal-700">View Details</Button>
        </Link>
      </div>
    </article>
  )
}
