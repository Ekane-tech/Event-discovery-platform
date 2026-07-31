import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import EventGrid from '../components/EventGrid.jsx'
import { EventGridSkeleton } from '../components/EventCardSkeleton.jsx'
import ActiveFilters from '../../search/components/ActiveFilters.jsx'
import EventFilters from '../../search/components/EventFilters.jsx'
import SearchBar from '../../search/components/SearchBar.jsx'
import SearchResultsHeader from '../../search/components/SearchResultsHeader.jsx'
import { useEventSearch } from '../../search/hooks/useEventSearch.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function BrowseEventsPage() {
  const { t } = useTranslation()
  const { filters, filteredEvents, totalResults, loading, error, updateFilter, resetFilters } = useEventSearch()
  const [showFilters, setShowFilters] = useState(false)

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{t('appName')}</span>
          <h1 className="mt-2 text-2xl font-black text-slate-950">{t('events.browse.title')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('events.browse.description')}</p>
        </div>
      </div>

      <div className="grid gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80">
            <SearchBar value={filters.keyword} onSearch={(keyword) => updateFilter('keyword', keyword)} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button type="button" onClick={() => setShowFilters((current) => !current)} className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-teal-700" />
                <h2 className="font-bold text-slate-950">{t('events.browse.refineSearch')}</h2>
              </div>
              {showFilters ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </button>
            {showFilters && (
              <div className="mt-4">
                <EventFilters filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />
              </div>
            )}
          </div>

          <ActiveFilters filters={filters} onReset={resetFilters} />
          <SearchResultsHeader totalResults={totalResults} totalEvents={totalResults} />

          {loading && <EventGridSkeleton count={6} />}
          {error && <ErrorState title={t('events.browse.loadErrorTitle')} message={error} />}
          {!loading && !error && filteredEvents.length === 0 && (
            <EmptyState title={t('events.browse.emptyTitle')} message={t('events.browse.emptyMessage')} />
          )}
          {!loading && !error && filteredEvents.length > 0 && <EventGrid events={filteredEvents} />}
        </div>
      </PageContainer>
  )
}
