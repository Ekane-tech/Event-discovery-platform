import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icons reference image paths that bundlers (Vite) break.
// Re-bind them to the imported asset URLs once, at module load.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

// Default centre: Douala, Cameroon.
const CAMEROON_CENTER = [4.0511, 9.7679]

/**
 * Reusable OpenStreetMap (Leaflet) map — no API key required.
 *
 * - Display mode (default): a fixed marker at latitude/longitude.
 * - Picker mode (draggable): marker is draggable and clicking the map moves it;
 *   calls onMove(lat, lng). Used by <LocationPicker/>.
 */
export default function LocationMap({
  latitude,
  longitude,
  zoom = 13,
  height = 260,
  draggable = false,
  onMove,
  scrollWheelZoom = true,
  className = '',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const hasCoords = latitude !== '' && latitude != null && longitude !== '' && longitude != null

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center = hasCoords ? [Number(latitude), Number(longitude)] : CAMEROON_CENTER
    const map = L.map(containerRef.current, { scrollWheelZoom, zoomControl: true, attributionControl: true }).setView(center, hasCoords ? zoom : 6)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(center, { draggable }).addTo(map)
    const emit = () => {
      const { lat, lng } = marker.getLatLng()
      onMove?.(lat, lng)
    }
    if (draggable) {
      marker.on('dragend', emit)
      map.on('click', (event) => {
        marker.setLatLng(event.latlng)
        emit()
      })
    }

    mapRef.current = map
    markerRef.current = marker

    // Leaflet can mis-size inside animated/hidden containers (e.g. page transitions).
    const resizeTimer = setTimeout(() => map.invalidateSize(), 250)

    return () => {
      clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Keep the marker/view in sync when coords change from the outside (e.g. a search).
  useEffect(() => {
    if (mapRef.current && markerRef.current && hasCoords) {
      const latlng = [Number(latitude), Number(longitude)]
      markerRef.current.setLatLng(latlng)
      mapRef.current.setView(latlng, zoom, { animate: true })
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-2xl border border-slate-200 ${className}`}
      style={{ height, width: '100%' }}
    />
  )
}
