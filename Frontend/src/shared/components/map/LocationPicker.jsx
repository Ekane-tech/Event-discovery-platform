import { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import LocationMap from './LocationMap.jsx'

// Free geocoding via OpenStreetMap Nominatim (no API key).
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('network')
  const data = await response.json()
  if (!data || data.length === 0) return null
  const first = data[0]
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), name: first.display_name }
}

/**
 * Form-friendly location picker: search an address (Nominatim) + a draggable map.
 * Calls onChange({ latitude, longitude, venue? }). `venue` is only sent when a
 * geocoded place name is found and the host hasn't typed one yet.
 */
export default function LocationPicker({ value, onChange, height = 280 }) {
  const { venue, latitude, longitude } = value
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event) {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError('')
    try {
      const result = await geocode(query)
      if (!result) {
        setError('Location not found. Try a more specific address or place name.')
        return
      }
      onChange({ latitude: result.lat, longitude: result.lng, venue: venue ? undefined : result.name })
    } catch {
      setError('Unable to search right now. You can still drag the pin to set the location.')
    } finally {
      setSearching(false)
    }
  }

  function handleMove(lat, lng) {
    onChange({ latitude: lat, longitude: lng })
  }

  return (
    <div className="grid gap-3">
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search an address or place (e.g. Bonanjo, Douala)…"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <LocationMap
        latitude={latitude}
        longitude={longitude}
        draggable
        onMove={handleMove}
        height={height}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" /> Drag the pin or click the map to set the exact location.
        </p>
        {latitude && longitude && (
          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
          </p>
        )}
      </div>
    </div>
  )
}
