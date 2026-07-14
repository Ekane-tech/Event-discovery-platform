import { useEffect, useMemo, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import SearchableSelect from '../../../shared/components/forms/SearchableSelect.jsx'
import { categoryService } from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'

const dateOptions = [
  { value: 'all', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
  { value: 'upcoming', label: 'Upcoming' },
]

const priceOptions = [
  { value: 'all', label: 'Any price' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const sortOptions = [
  { value: 'upcoming', label: 'Soonest first' },
  { value: 'latest', label: 'Latest date' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'price_low', label: 'Lowest price' },
  { value: 'price_high', label: 'Highest price' },
]

export default function EventFilters({ filters, onFilterChange, onReset }) {
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

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All categories' },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
  ], [categories])

  const cityOptions = useMemo(() => [
    { value: '', label: 'All cities' },
    ...cities.map((city) => ({ value: String(city.id), label: city.name })),
  ], [cities])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-950">Filters</h2>
        <Button type="button" variant="secondary" onClick={onReset}>Reset</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SearchableSelect
          label="Category"
          value={filters.category_id}
          onChange={(value) => onFilterChange('category_id', value || 'all')}
          options={categoryOptions}
          placeholder="All categories"
        />

        <SearchableSelect
          label="City"
          value={filters.city_id}
          onChange={(value) => onFilterChange('city_id', value || '')}
          options={cityOptions}
          placeholder="All cities"
        />

        <SearchableSelect
          label="Date"
          value={filters.date}
          onChange={(value) => onFilterChange('date', value || 'all')}
          options={dateOptions}
          placeholder="Any date"
          searchPlaceholder="Search date options..."
        />

        <SearchableSelect
          label="Price"
          value={filters.price}
          onChange={(value) => onFilterChange('price', value || 'all')}
          options={priceOptions}
          placeholder="Any price"
          searchPlaceholder="Search price options..."
        />

        <SearchableSelect
          label="Sort by"
          value={filters.sort}
          onChange={(value) => onFilterChange('sort', value || 'upcoming')}
          options={sortOptions}
          placeholder="Soonest first"
          searchPlaceholder="Search sort options..."
        />
      </div>
    </div>
  )
}
