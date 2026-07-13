import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import EventGrid from '../components/EventGrid.jsx'
import { EventGridSkeleton } from '../components/EventCardSkeleton.jsx'
import { eventService } from '../services/eventService.js'
import { extractCollection, normalizeEvents } from '../utils/normalizeEvent.js'
import { categoryService } from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import SearchSuggestInput from '../../search/components/SearchSuggestInput.jsx'

const WHEN_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'upcoming', label: 'Upcoming' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [searchForm, setSearchForm] = useState({ what: '', where: '', when: '' })

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [eventsResponse, categoriesResponse, regionsResponse, citiesResponse] = await Promise.all([
          eventService.getEvents({ date: 'upcoming', per_page: 6 }),
          categoryService.getCategories(),
          locationService.getRegions(),
          locationService.getCities(),
        ])

        setEvents(normalizeEvents(extractCollection(eventsResponse.data, 'events')))
        setCategories(extractCollection(categoriesResponse.data, 'categories'))
        setRegions(extractCollection(regionsResponse.data, 'regions'))
        setCities(extractCollection(citiesResponse.data, 'cities'))
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  const whatSuggestions = useMemo(() => [
    ...categories.map((category) => ({ id: category.id, label: category.name, type: 'category', value: category.id })),
    ...events.map((event) => ({ id: event.id, label: event.title, type: 'event', value: event.title })),
  ], [categories, events])

  const whereSuggestions = useMemo(() => [
    ...cities.map((city) => ({ id: city.id, label: city.name, type: 'city', value: city.id })),
    ...regions.map((region) => ({ id: region.id, label: region.name, type: 'region', value: region.id })),
  ], [cities, regions])

  function updateSearchField(name, value) {
    setSearchForm((current) => ({ ...current, [name]: value }))
  }

  function findExactSuggestion(suggestions, value) {
    return suggestions.find((item) => item.label.toLowerCase() === String(value || '').trim().toLowerCase())
  }

  function handleSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    const whatMatch = findExactSuggestion(whatSuggestions, searchForm.what)
    const whereMatch = findExactSuggestion(whereSuggestions, searchForm.where)

    if (whatMatch?.type === 'category') {
      params.set('category_id', whatMatch.value)
    } else if (searchForm.what.trim()) {
      params.set('keyword', searchForm.what.trim())
    }

    if (whereMatch?.type === 'city') {
      params.set('city_id', whereMatch.value)
    } else if (whereMatch?.type === 'region') {
      params.set('region_id', whereMatch.value)
    }

    if (searchForm.when) {
      params.set('date', searchForm.when)
    }

    navigate(`/events${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <PageContainer>
      <section className="overflow-visible rounded-3xl bg-cover bg-center px-6 py-20 text-white md:px-12" style={{ backgroundImage: 'linear-gradient(90deg, rgba(15,23,42,.82), rgba(15,118,110,.58)), url(/hero-events.svg)' }}>
        <p className="font-semibold text-teal-100">Discover events that match your interests</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold md:text-6xl">Find the right events and get notified when they matter.</h1>
        <p className="mt-5 max-w-2xl text-slate-100">Browse conferences, concerts, workshops, business forums, sports, culture, and more across Cameroon.</p>

        <form onSubmit={handleSearch} className="mt-8 grid max-w-5xl gap-4 rounded-3xl bg-white/95 p-5 text-slate-950 shadow-xl lg:grid-cols-[1fr_1fr_220px_auto] lg:items-end">
          <SearchSuggestInput
            label="Looking for"
            placeholder="Any event, category, or keyword"
            value={searchForm.what}
            onChange={(value) => updateSearchField('what', value)}
            suggestions={whatSuggestions}
          />
          <SearchSuggestInput
            label="Where"
            placeholder="Any city or region"
            value={searchForm.where}
            onChange={(value) => updateSearchField('where', value)}
            suggestions={whereSuggestions}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">When</span>
            <Select value={searchForm.when} onChange={(event) => updateSearchField('when', event.target.value)} className="h-12">
              {WHEN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </label>
          <Button type="submit" className="h-12 bg-pink-600 px-8 hover:bg-pink-700">Search</Button>
        </form>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/events"><Button className="bg-white text-slate-950 hover:bg-slate-100">Browse Events</Button></Link>
          <Link to="/register"><Button variant="secondary">Create Account</Button></Link>
          <Link to="/organizer/events/create"><Button className="bg-teal-500 text-white hover:bg-teal-600">Become a service provider</Button></Link>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeader title="Upcoming events" description="Explore published events from the platform." />
        {loading ? <EventGridSkeleton count={6} /> : <EventGrid events={events} />}
      </section>
    </PageContainer>
  )
}
