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
    { value: 'all', label: t('searchPage.filters.anyDate') },
    { value: 'today', label: t('searchPage.filters.today') },
    { value: 'week', label: t('searchPage.filters.next7Days') },
    { value: 'month', label: t('searchPage.filters.next30Days') },
    { value: 'upcoming', label: t('searchPage.filters.upcoming') },
  ]

  const priceOptions = [
    { value: 'all', label: t('searchPage.filters.anyPrice') },
    { value: 'free', label: t('searchPage.filters.free') },
    { value: 'paid', label: t('searchPage.filters.paid') },
  ]

  const sortOptions = [
    { value: 'upcoming', label: t('searchPage.filters.soonestFirst') },
    { value: 'latest', label: t('searchPage.filters.latestDate') },
    { value: 'popularity', label: t('searchPage.filters.mostPopular') },
    { value: 'price_low', label: t('searchPage.filters.lowestPrice') },
    { value: 'price_high', label: t('searchPage.filters.highestPrice') },
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
    { value: 'all', label: t('searchPage.filters.allCategories') },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
  ], [categories, t])

  const cityOptions = useMemo(() => [
    { value: '', label: t('searchPage.filters.allCities') },
    ...cities.map((city) => ({ value: String(city.id), label: city.name })),
  ], [cities, t])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-950">{t('searchPage.filters.title')}</h2>
        <Button type="button" variant="secondary" onClick={onReset}>{t('reset')}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SearchableSelect
          label={t('searchPage.filters.category')}
          value={filters.category_id}
          onChange={(value) => onFilterChange('category_id', value || 'all')}
          options={categoryOptions}
          placeholder={t('searchPage.filters.allCategories')}
        />

        <SearchableSelect
          label={t('searchPage.filters.city')}
          value={filters.city_id}
          onChange={(value) => onFilterChange('city_id', value || '')}
          options={cityOptions}
          placeholder={t('searchPage.filters.allCities')}
        />

        <SearchableSelect
          label={t('searchPage.filters.date')}
          value={filters.date}
          onChange={(value) => onFilterChange('date', value || 'all')}
          options={dateOptions}
          placeholder={t('searchPage.filters.anyDate')}
          searchPlaceholder={t('searchPage.filters.searchDate')}
        />

        <SearchableSelect
          label={t('searchPage.filters.price')}
          value={filters.price}
          onChange={(value) => onFilterChange('price', value || 'all')}
          options={priceOptions}
          placeholder={t('searchPage.filters.anyPrice')}
          searchPlaceholder={t('searchPage.filters.searchPrice')}
        />

        <SearchableSelect
          label={t('searchPage.filters.sortBy')}
          value={filters.sort}
          onChange={(value) => onFilterChange('sort', value || 'upcoming')}
          options={sortOptions}
          placeholder={t('searchPage.filters.soonestFirst')}
          searchPlaceholder={t('searchPage.filters.searchSort')}
        />
      </div>
    </div>
  )
}
