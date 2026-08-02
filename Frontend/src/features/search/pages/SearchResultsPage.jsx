import { useEffect, useState } from 'react'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import EventGrid from '../../events/components/EventGrid.jsx'
import { eventService } from '../../events/services/eventService.js'
import ActiveFilters from '../components/ActiveFilters.jsx'
import EventFilters from '../components/EventFilters.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SearchResultsHeader from '../components/SearchResultsHeader.jsx'
import { useEventSearch } from '../hooks/useEventSearch.js'
import { extractCollection, normalizeEvents } from '../../events/utils/normalizeEvent.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

export default function SearchResultsPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const {
    filters,
    filteredEvents,
    totalResults,
    updateFilter,
    resetFilters,
  } = useEventSearch(events)

  useEffect(() => {
    async function fetchEvents() {
      setError('')
      try {
        const response = await eventService.getEvents({ per_page: 100 })
        setEvents(normalizeEvents(extractCollection(response.data, 'events')))
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, t('searchPage.loadError')))
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [t])

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader
          title={t('searchPage.title')}
          description={t('searchPage.description')}
        />
        <div className="text-center text-slate-500">{t('searchPage.loadingEvents')}</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SectionHeader
        title={t('searchPage.title')}
        description={t('searchPage.description')}
      />

      <div className="grid gap-5">
        <SearchBar value={filters.keyword} onSearch={(keyword) => updateFilter('keyword', keyword)} />
        <EventFilters filters={filters} onFilterChange={updateFilter} onReset={resetFilters} />
        <ActiveFilters filters={filters} onReset={resetFilters} />
        <SearchResultsHeader totalResults={totalResults} totalEvents={events.length} />

        {error ? (
          <ErrorState title={t('searchPage.loadErrorTitle')} message={error} />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title={t('searchPage.noResults')}
            message={t('searchPage.noResultsMessage')}
          />
        ) : (
          <EventGrid events={filteredEvents} />
        )}
      </div>
    </PageContainer>
  )
}
