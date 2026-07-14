import Badge from '../../../shared/components/ui/Badge.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { getActiveFilters } from '../utils/filterEvents.js'

const labels = {
  keyword: 'Keyword',
  category_id: 'Category',
  city_id: 'City',
  date: 'Date',
  price: 'Price',
  sort: 'Sort',
}

function formatFilterValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    return value.name || value.title || value.label || JSON.stringify(value)
  }
  return String(value)
}

export default function ActiveFilters({ filters, onReset }) {
  const activeFilters = getActiveFilters(filters)

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600">Active filters:</span>
      {activeFilters.map(([key, value]) => (
        <Badge key={key}>{labels[key] || key}: {formatFilterValue(value)}</Badge>
      ))}
      <Button type="button" variant="secondary" onClick={onReset} className="px-3 py-1 text-sm">Clear all</Button>
    </div>
  )
}
