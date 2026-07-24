import { useEffect, useState } from 'react'
import Badge from '../../../shared/components/ui/Badge.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { getActiveFilters } from '../utils/filterEvents.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import { categoryService } from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'

function formatFilterValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    return value.name || value.title || value.label || JSON.stringify(value)
  }
  return String(value)
}

export default function ActiveFilters({ filters, onReset }) {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])

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

  const labels = {
    keyword: t('searchPage.filters.keyword', 'Keyword'),
    category_id: t('searchPage.filters.category', 'Category'),
    city_id: t('searchPage.filters.city', 'City'),
    date: t('searchPage.filters.date', 'Date'),
    price: t('searchPage.filters.price', 'Price'),
    sort: t('searchPage.filters.sort', 'Sort'),
  }
  const activeFilters = getActiveFilters(filters)

  function getDisplayValue(key, value) {
    if (key === 'category_id') {
      const category = categories.find((c) => String(c.id) === String(value))
      return category?.name || formatFilterValue(value)
    }
    if (key === 'city_id') {
      const city = cities.find((c) => String(c.id) === String(value))
      return city?.name || formatFilterValue(value)
    }
    return formatFilterValue(value)
  }

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600">{t('searchPage.activeFilters', 'Active filters:')}</span>
      {activeFilters.map(([key, value]) => (
        <Badge key={key}>{labels[key] || key}: {getDisplayValue(key, value)}</Badge>
      ))}
      <Button type="button" variant="secondary" onClick={onReset} className="px-3 py-1 text-sm">{t('searchPage.clearAll', 'Clear all')}</Button>
    </div>
  )
}
