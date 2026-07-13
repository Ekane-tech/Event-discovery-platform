import { SlidersHorizontal, Sparkles } from 'lucide-react'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import EventGrid from '../components/EventGrid.jsx'
import { EventGridSkeleton } from '../components/EventCardSkeleton.jsx'
import ActiveFilters from '../../search/components/ActiveFilters.jsx'
import EventFilters from '../../search/components/EventFilters.jsx'
import SearchBar from '../../search/components/SearchBar.jsx'
import SearchResultsHeader from '../../search/components/SearchResultsHeader.jsx'
import { useEventSearch } from '../../search/hooks/useEventSearch.js'

export default function BrowseEventsPage() {
  const { filters, filteredEvents, totalResults, loading, error, updateFilter, resetFilters } = useEventSearch()

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: 'url(/hero-events.svg)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-teal-900/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100 backdrop-blur"><Sparkles className="h-4 w-4" /> Event discovery</span>
            <h1 className="mt-5 text-4xl font-black md:text-6xl">Browse events made for you.</h1>
            <p className="mt-4 text-lg leading-8 text-slate-200">Find conferences, concerts, workshops, sports, culture, business events and more. Use filters to discover the right event faster.</p>
          </div>
        </div>
      </section>

      <PageContainer>
        <div className="-mt-12 relative z-10 grid gap-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
            <SearchBar value={filters.keyword} onSearch={(keyword) => updateFilter('keyword', keyword)} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-teal-700" />
              <h2 className="font-bold text-slate-950">Refine your search</h2>
            </div>
            <EventFilters filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />
          </div>

          <ActiveFilters filters={filters} onReset={resetFilters} />
          <SearchResultsHeader totalResults={totalResults} totalEvents={totalResults} />

          {loading && <EventGridSkeleton count={6} />}
          {error && <ErrorState title="Unable to load events" message={error} />}
          {!loading && !error && filteredEvents.length === 0 && <EmptyState title="No events found" message="Try changing your search filters or check again later for new events." />}
          {!loading && !error && filteredEvents.length > 0 && <EventGrid events={filteredEvents} />}
        </div>
      </PageContainer>
    </div>
  )
}
