import { useEffect, useMemo, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import SearchableSelect from '../../../shared/components/forms/SearchableSelect.jsx'
import { categoryService } from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function EventFilters({ filters, onFilterChange, onReset }) {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])

  const dateOptions = [
    { value: 'all', label: t('searchPage.filters.anyDate', 'Any date') },
    { value: 'today', label: t('searchPage.filters.today', 'Today') },
    { value: 'week', label: t('searchPage.filters.next7Days', 'Next 7 days') },
    { value: 'month', label: t('searchPage.filters.next30Days', 'Next 30 days') },
    { value: 'upcoming', label: t('searchPage.filters.upcoming', 'Upcoming') },
  ]

  const priceOptions = [
    { value: 'all', label: t('searchPage.filters.anyPrice', 'Any price') },
    { value: 'free', label: t('searchPage.filters.free', 'Free') },
    { value: 'paid', label: t('searchPage.filters.paid', 'Paid') },
  ]

  const sortOptions = [
    { value: 'upcoming', label: t('searchPage.filters.soonestFirst', 'Soonest first') },
    { value: 'latest', label: t('searchPage.filters.latestDate', 'Latest date') },
    { value: 'popularity', label: t('searchPage.filters.mostPopular', 'Most popular') },
    { value: 'price_low', label: t('searchPage.filters.lowestPrice', 'Lowest price') },
    { value: 'price_high', label: t('searchPage.filters.highestPrice', 'Highest price') },
  ]

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoriesResponse, citiesResponse] = await Promise.all([
          categoryService.getCategories(),
          locationService.getCities(),
        ])
        setCategories(extractCollection(categoriesResponse.data, 'categories'))
        setCities(extractCollection(citiesResponse.data, 'cities'))
      } catch {
        setCategories([])
        setCities([])
      }
    }

    loadOptions()
  }, [])

  const categoryOptions = useMemo(() => [
    { value: 'all', label: t('searchPage.filters.allCategories', 'All categories') },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
  ], [categories, t])

  const cityOptions = useMemo(() => [
    { value: '', label: t('searchPage.filters.allCities', 'All cities') },
    ...cities.map((city) => ({ value: String(city.id), label: city.name })),
  ], [cities, t])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-950">{t('searchPage.filters.title', 'Filters')}</h2>
        <Button type="button" variant="secondary" onClick={onReset}>{t('reset', 'Reset')}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SearchableSelect
          label={t('searchPage.filters.category', 'Category')}
          value={filters.category_id}
          onChange={(value) => onFilterChange('category_id', value || 'all')}
          options={categoryOptions}
          placeholder={t('searchPage.filters.allCategories', 'All categories')}
        />

        <SearchableSelect
          label={t('searchPage.filters.city', 'City')}
          value={filters.city_id}
          onChange={(value) => onFilterChange('city_id', value || '')}
          options={cityOptions}
          placeholder={t('searchPage.filters.allCities', 'All cities')}
        />

        <SearchableSelect
          label={t('searchPage.filters.date', 'Date')}
          value={filters.date}
          onChange={(value) => onFilterChange('date', value || 'all')}
          options={dateOptions}
          placeholder={t('searchPage.filters.anyDate', 'Any date')}
          searchPlaceholder={t('searchPage.filters.searchDate', 'Search date options...')}
        />

        <SearchableSelect
          label={t('searchPage.filters.price', 'Price')}
          value={filters.price}
          onChange={(value) => onFilterChange('price', value || 'all')}
          options={priceOptions}
          placeholder={t('searchPage.filters.anyPrice', 'Any price')}
          searchPlaceholder={t('searchPage.filters.searchPrice', 'Search price options...')}
        />

        <SearchableSelect
          label={t('searchPage.filters.sortBy', 'Sort by')}
          value={filters.sort}
          onChange={(value) => onFilterChange('sort', value || 'upcoming')}
          options={sortOptions}
          placeholder={t('searchPage.filters.soonestFirst', 'Soonest first')}
          searchPlaceholder={t('searchPage.filters.searchSort', 'Search sort options...')}
        />
      </div>
    </div>
  )
}
