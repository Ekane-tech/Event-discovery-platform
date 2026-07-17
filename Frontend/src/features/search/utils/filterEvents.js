export function getActiveFilters(filters = {}) {
  return Object.entries(filters).filter(([key, value]) => {
    if (value === null || value === undefined || value === '') return false
    if (key === 'sort') return value !== 'upcoming'
    if (key === 'date') return value !== 'upcoming' && value !== 'all'
    return value !== 'all'
  })
}

export function filterEvents(events = []) {
  return events
}
