import { BadgeCheck, Bookmark, CalendarDays, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import { useBookmarks } from '../../bookmarks/hooks/useBookmarks.js'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import RecommendationReasons from './RecommendationReasons.jsx'
import RecommendationScoreBadge from './RecommendationScoreBadge.jsx'
import { getEventLifecycle } from '../../events/utils/eventLifecycle.js'

export default function RecommendedEventCard({ event }) {
  const location = useLocation()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(event.id)
  const bg = event.coverImage?.url || '/hero-events.svg'
  const lifecycle = getEventLifecycle(event)

  async function handleBookmark(clickEvent) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    try {
      const added = await toggleBookmark(event.id)
      toast.success(added ? 'Event bookmarked.' : 'Bookmark removed.')
    } catch {
      toast.error('Unable to update bookmark.')
    }
  }

  return (
    <Link to={`/events/${event.id}`} state={{ from: `${location.pathname}${location.search}` }} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-52 overflow-hidden bg-slate-900 shrink-0">
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${bg})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {!lifecycle.isPast && lifecycle.registrationDeadlineUrgent && (
            <span className="mboa-radar-bloom flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-950/30 ring-1 ring-white/30 backdrop-blur">
              <Clock className="h-5 w-5" />
            </span>
          )}
          <button onClick={handleBookmark} className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition ${bookmarked ? 'bg-yellow-400 text-slate-950' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
          {lifecycle.isPast && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
              <Clock className="h-3.5 w-3.5" /> Past event
            </span>
          )}
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">{event.category || 'Event'}</span>
          <RecommendationScoreBadge score={event.recommendationScore} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-700">Recommended for you</div>
        <h3 className="text-xl font-black leading-tight text-slate-950">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
        <RecommendationReasons reasons={event.recommendationReasons} />
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-700" /> {event.city}, {event.region}</p>
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-700" /> {formatDate(event.startDate)}</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Organized by</p>
              <Link to={event.organizerId ? `/organizers/${event.organizerId}` : '#'} onClick={(clickEvent) => clickEvent.stopPropagation()} className="truncate text-sm font-black text-slate-950">
                {event.organizerName || event.organizer || 'Organizer'}
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-900">{formatPrice(event.price)}</span>
            <Button className="rounded-full bg-teal-600 px-5 text-white hover:bg-teal-700">View Details</Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
