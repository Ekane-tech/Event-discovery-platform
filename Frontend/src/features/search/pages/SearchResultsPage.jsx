import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import EventGrid from '../../events/components/EventGrid.jsx'
import { mockEvents } from '../../events/services/mockEvents.js'
import ActiveFilters from '../components/ActiveFilters.jsx'
import EventFilters from '../components/EventFilters.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SearchResultsHeader from '../components/SearchResultsHeader.jsx'
import { useEventSearch } from '../hooks/useEventSearch.js'

export default function SearchResultsPage() {
  const {
    filters,
    filteredEvents,
    totalResults,
    updateFilter,
    resetFilters,
  } = useEventSearch(mockEvents)

  return (
    <PageContainer>
      <SectionHeader
        title="Search Events"
        description="Find events by keyword, category, region, city, date, price, organizer, and popularity."
      />

      <div className="grid gap-5">
        <SearchBar value={filters.keyword} onSearch={(keyword) => updateFilter('keyword', keyword)} />
        <EventFilters filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />
        <ActiveFilters filters={filters} onReset={resetFilters} />
        <SearchResultsHeader totalResults={totalResults} totalEvents={mockEvents.length} />

        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No events found"
            message="Try changing the keyword, category, region, date, or price filter."
          />
        ) : (
          <EventGrid events={filteredEvents} />
        )}
      </div>
    </PageContainer>
  )
}