import { API_BASE_URL } from '../../../shared/constants/app.js'
import { normalizeEvents, extractCollection } from '../../events/utils/normalizeEvent.js'

function storageUrl(path) {
  if (!path) return ''
  if (String(path).startsWith('http') || String(path).startsWith('data:') || String(path).startsWith('blob:')) return path
  return `${API_BASE_URL.replace('/api', '')}/storage/${path}`
}

export function normalizeOrganizer(apiOrganizer) {
  if (!apiOrganizer) return null
  const profile = apiOrganizer.profile || {}
  return {
    id: apiOrganizer.id,
    name: apiOrganizer.name,
    email: apiOrganizer.email,
    organizationName: profile.organization_name || apiOrganizer.name,
    displayName: profile.organization_name || apiOrganizer.name,
    avatar: storageUrl(profile.avatar),
    city: profile.city || '',
    region: profile.region || '',
    bio: profile.bio || '',
    isVerified: Boolean(profile.is_verified_organizer),
    publishedEventsCount: apiOrganizer.published_events_count || 0,
    raw: apiOrganizer,
  }
}

export function normalizeOrganizers(payload) {
  return extractCollection(payload, 'organizers').map(normalizeOrganizer).filter(Boolean)
}

export function normalizeOrganizerProfile(payload) {
  return {
    organizer: normalizeOrganizer(payload?.organizer),
    events: normalizeEvents(extractCollection(payload || {}, 'events')),
  }
}
