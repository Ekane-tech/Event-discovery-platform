import { useEffect, useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import { categoryService } from '../../categories/services/categoryService.js'
import { locationService } from '../../locations/services/locationService.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'

export default function EventFilters({ filters, onFilterChange, onReset }) {
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoriesResponse, regionsResponse, citiesResponse] = await Promise.all([
          categoryService.getCategories(),
          locationService.getRegions(),
          locationService.getCities(),
        ])
        setCategories(extractCollection(categoriesResponse.data, 'categories'))
        setRegions(extractCollection(regionsResponse.data, 'regions'))
        setCities(extractCollection(citiesResponse.data, 'cities'))
      } catch {
        setCategories([])
        setRegions([])
        setCities([])
      }
    }

    loadOptions()
  }, [])

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-950">Filters</h2>
        <Button type="button" variant="secondary" onClick={onReset}>Reset</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.category_id} onChange={(event) => onFilterChange('category_id', event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>

        <Select value={filters.region_id} onChange={(event) => onFilterChange('region_id', event.target.value)}>
          <option value="all">All regions</option>
          {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
        </Select>

        <Select value={filters.city_id} onChange={(event) => onFilterChange('city_id', event.target.value)}>
          <option value="">All cities</option>
          {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
        </Select>

        <Input
          value={filters.organizer_id}
          onChange={(event) => onFilterChange('organizer_id', event.target.value)}
          placeholder="Organizer ID"
        />

        <Select value={filters.date} onChange={(event) => onFilterChange('date', event.target.value)}>
          <option value="all">Any date</option>
          <option value="today">Today</option>
          <option value="week">Next 7 days</option>
          <option value="month">Next 30 days</option>
          <option value="upcoming">Upcoming</option>
        </Select>

        <Select value={filters.price} onChange={(event) => onFilterChange('price', event.target.value)}>
          <option value="all">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </Select>

        <Select value={filters.sort} onChange={(event) => onFilterChange('sort', event.target.value)}>
          <option value="upcoming">Soonest first</option>
          <option value="latest">Latest date</option>
          <option value="popularity">Most popular</option>
          <option value="price_low">Lowest price</option>
          <option value="price_high">Highest price</option>
        </Select>
      </div>
    </div>
  )
}
