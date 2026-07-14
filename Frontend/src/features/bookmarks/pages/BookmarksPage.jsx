import { Bookmark, CalendarSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import StatCardSkeleton from '../../../shared/components/feedback/StatCardSkeleton.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import EventGrid from '../../events/components/EventGrid.jsx'
import { EventGridSkeleton } from '../../events/components/EventCardSkeleton.jsx'
import { useBookmarks } from '../hooks/useBookmarks.js'

export default function BookmarksPage() {
  const { bookmarkedEvents, bookmarkCount, loading, error } = useBookmarks()

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-linear-to-r from-yellow-500 to-orange-600 p-8 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur"><Bookmark className="h-4 w-4" /> Saved events</span>
            <h1 className="mt-5 text-4xl font-black">Your bookmarked events</h1>
            <p className="mt-3 max-w-2xl text-white/90">Keep track of events you want to revisit, compare, or register for later.</p>
          </div>
          <Link to="/events"><Button variant="light"><CalendarSearch className="mr-2 h-4 w-4" /> Browse Events</Button></Link>
        </div>
      </section>

      <div className="mt-6">
        <div className="mb-6 max-w-sm">
          {loading ? <StatCardSkeleton compact /> : (
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-yellow-500 to-orange-600 p-5 text-white shadow-sm">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
              <div className="relative flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25"><Bookmark className="h-5 w-5" /></span>
                <span className="text-3xl font-black">{bookmarkCount}</span>
              </div>
              <p className="relative mt-4 text-sm font-bold text-white/90">Saved events</p>
            </div>
          )}
        </div>
        {loading && <EventGridSkeleton count={6} />}
        {error && <ErrorState title="Unable to load bookmarks" message={error} />}
        {!loading && !error && bookmarkCount === 0 && <EmptyState title="No saved events yet" message="Browse events and use the bookmark icon to save events here." />}
        {!loading && !error && bookmarkCount > 0 && <EventGrid events={bookmarkedEvents} />}
      </div>
    </PageContainer>
  )
}
