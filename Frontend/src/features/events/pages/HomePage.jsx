import { CalendarSearch, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import Button from '../../../shared/components/ui/Button.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import EventGrid from '../components/EventGrid.jsx'
import { EventGridSkeleton } from '../components/EventCardSkeleton.jsx'
import { eventService } from '../services/eventService.js'
import { extractCollection, normalizeEvents } from '../utils/normalizeEvent.js'
import { categoryService} from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import SearchSuggestInput from '../../search/components/SearchSuggestInput.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import { Stagger, StaggerItem } from '../../../shared/components/motion/Stagger.jsx'

export default function HomePage()  {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [searchForm, setSearchForm] = useState({ what: '', where: '', when: '' })

  const whenOptions = [
    { value: '', label: t('home.anyTime') },
    { value: 'today', label: t('home.today') },
    { value: 'week', label: t('home.thisWeek') },
    { value: 'month', label: t('home.thisMonth') },
    { value: 'upcoming', label: t('home.upcoming') },
  ]

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

    if (whatMatch?.type === 'category') params.set('category_id', whatMatch.value)
    else if (searchForm.what.trim()) params.set('keyword', searchForm.what.trim())

    if (whereMatch?.type === 'city') params.set('city_id', whereMatch.value)
    else if (whereMatch?.type === 'region') params.set('region_id', whereMatch.value)

    if (searchForm.when) params.set('date', searchForm.when)

    navigate(`/events${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div>
      <section className="relative min-h-112.5 overflow-visible bg-cover bg-center text-white" style={{ backgroundImage: 'url(/Hero-Image.jpg)' }}>
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur animate-fade-in-up"> {t('home.badge')}</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight md:text-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>{t('home.title')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{t('home.subtitle')}</p>

          <form onSubmit={handleSearch} className="mt-10 grid max-w-6xl gap-4 rounded-3xl bg-white p-5 text-slate-950 shadow-2xl lg:grid-cols-[1fr_1fr_220px_auto] lg:items-end animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <SearchSuggestInput label={t('home.lookingFor')} placeholder={t('home.lookingForPlaceholder')} value={searchForm.what} onChange={(value) => updateSearchField('what', value)} suggestions={whatSuggestions} />
            <SearchSuggestInput label={t('home.where')} placeholder={t('home.wherePlaceholder')} value={searchForm.where} onChange={(value) => updateSearchField('where', value)} suggestions={whereSuggestions} />
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">{t('home.when')}</span><Select value={searchForm.when} onChange={(event) => updateSearchField('when', event.target.value)} className="h-12">{whenOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>
            <Button type="submit" variant="pink" className="h-12 px-8"><Search className="mr-2 h-4 w-4" /> {t('search')}</Button>
          </form>

          <div className="mt-7 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/events"><Button variant="light"><CalendarSearch className="mr-2 h-4 w-4" /> {t('browseEvents')}</Button></Link>
            <Link to="/register"><Button variant="secondary">{t('createAccount')}</Button></Link>
            <Link to="/organizer/events/create"><Button className="bg-teal-500 text-white hover:bg-teal-600">{t('becomeProvider')}</Button></Link>
          </div>
        </div>
      </section>

      <PageContainer>
        <section>
          <SectionHeader title={t('home.featuredCategories')} description={t('home.featuredCategoriesDescription')} />
          {loading ? <EventGridSkeleton count={6} /> :
          <Stagger className="grid gap-5 max-sm:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 20).map((category) => (
              <StaggerItem key={category.id}>
              <Link to={`/events?category_id=${category.id}`} className="group relative block min-h-47.5 overflow-hidden rounded-xl bg-slate-900 p-5 text-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${category.image_url || '/hero-events.svg'})` }} />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/45 to-slate-950/5" />
                <div className="relative flex min-h-37.5 flex-col justify-end overflow-hidden">
                <h3 className="text-xl max-md:text-base font-black drop-shadow-sm truncate w-full" title={category.name}>{category.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-white drop-shadow-sm">{category.description}</p>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </Stagger> }
        </section>

        <section className="mt-8">
          <SectionHeader title={t('home.upcomingEvents')} description={t('home.upcomingEventsDescription')} />
          {loading ? <EventGridSkeleton count={6} /> : <EventGrid events={events} />}
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl bg-slate-950 p-8 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="text-3xl font-black">{t('home.providerTitle')}</h2><p className="mt-3 max-w-2xl text-slate-300">{t('home.providerText')}</p></div><Link to="/register"><Button variant="pink">{t('becomeProvider')}</Button></Link></div>
        </section>
      </PageContainer>
    </div>
  )
}
