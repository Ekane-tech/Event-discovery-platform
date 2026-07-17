import { Bookmark, CalendarDays, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useLocation } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import { useBookmarks } from '../../bookmarks/hooks/useBookmarks.js'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../shared/utils/currency.js'
import RecommendationReasons from './RecommendationReasons.jsx'
import RecommendationScoreBadge from './RecommendationScoreBadge.jsx'

export default function RecommendedEventCard({ event }) {
  const location = useLocation()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(event.id)
  const bg = event.coverImage?.url || '/hero-events.svg'

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
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-52 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${bg})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
        <button onClick={handleBookmark} className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition ${bookmarked ? 'bg-yellow-400 text-slate-950' : 'bg-white/20 text-white hover:bg-white/30'}`}>
          <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">{event.category || 'Event'}</span>
          <RecommendationScoreBadge score={event.recommendationScore} />
        </div>
      </div>

      <div className="flex flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-700">Recommended for you</div>
        <h3 className="text-xl font-black leading-tight text-slate-950">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
        <RecommendationReasons reasons={event.recommendationReasons} />
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-700" /> {event.city}, {event.region}</p>
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-700" /> {formatDate(event.startDate)}</p>
          <p className="font-semibold text-slate-900">{formatPrice(event.price)} • {event.organizer}</p>
        </div>
        <Link to={`/events/${event.id}`} state={{ from: `${location.pathname}${location.search}` }} className="mt-auto pt-5 block">
          <Button className="w-full rounded-full">View Details</Button>
        </Link>
      </div>
    </article>
  )
}
