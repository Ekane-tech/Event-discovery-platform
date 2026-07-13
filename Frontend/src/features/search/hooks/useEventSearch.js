import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventService } from '../../events/services/eventService.js'
import { extractCollection, normalizeEvents } from '../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

export const defaultEventFilters = {
  keyword: '',
  category_id: 'all',
  region_id: 'all',
  city_id: '',
  organizer_id: '',
  date: 'upcoming',
  price: 'all',
  sort: 'upcoming',
}

function getFiltersFromSearchParams(searchParams) {
  return Object.fromEntries(
    Object.entries(defaultEventFilters).map(([key, defaultValue]) => [key, searchParams.get(key) || defaultValue]),
  )
}

function shouldKeepInUrl(key, value) {
  return value && value !== defaultEventFilters[key]
}

function toApiParams(filters) {
  const params = {}
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.category_id && filters.category_id !== 'all') params.category_id = filters.category_id
  if (filters.region_id && filters.region_id !== 'all') params.region_id = filters.region_id
  if (filters.city_id) params.city_id = filters.city_id
  if (filters.organizer_id) params.organizer_id = filters.organizer_id
  if (filters.date && filters.date !== 'all') params.date = filters.date
  if (filters.price && filters.price !== 'all') params.price = filters.price
  if (filters.sort) params.sort = filters.sort === 'popularity' ? 'popular' : filters.sort
  params.per_page = 50
  return params
}

export function useEventSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const searchParamsString = searchParams.toString()
  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParamsString])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await eventService.getEvents(toApiParams(filters))
      setEvents(normalizeEvents(extractCollection(response.data, 'events')))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load events.'))
    } finally {
      setLoading(false)
    }
  }, [searchParamsString])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  function writeFiltersToUrl(nextFilters) {
    const nextSearchParams = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (shouldKeepInUrl(key, value)) nextSearchParams.set(key, value)
    })
    setSearchParams(nextSearchParams, { replace: true })
  }

  function updateFilter(name, value) {
    writeFiltersToUrl({ ...filters, [name]: value })
  }

  function updateFilters(nextFilters) {
    writeFiltersToUrl({ ...filters, ...nextFilters })
  }

  function resetFilters() {
    setSearchParams({}, { replace: true })
  }

  return {
    filters,
    filteredEvents: events,
    events,
    totalResults: events.length,
    loading,
    error,
    updateFilter,
    updateFilters,
    resetFilters,
    refetch: fetchEvents,
  }
}
