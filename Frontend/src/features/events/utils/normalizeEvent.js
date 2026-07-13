import { API_BASE_URL } from '../../../shared/constants/app.js'
function getStorageUrl(path) {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  const baseUrl = API_BASE_URL.replace('/api', '')
  return `${baseUrl}/storage/${path}`
}

function normalizeImage(image) {
  return {
    id: image.id,
    path: image.path,
    type: image.type,
    isCover: image.is_cover ?? image.isCover ?? false,
    url: getStorageUrl(image.path),
    raw: image,
  }
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function extractCollection(payload, key) {
  const value = payload?.[key]
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export function normalizeEvent(apiEvent) {
  if (!apiEvent) return null

  return {
    id: apiEvent.id,
    organizerId: apiEvent.organizer_id,
    categoryId: apiEvent.category_id,
    regionId: apiEvent.region_id,
    divisionId: apiEvent.division_id,
    cityId: apiEvent.city_id,
    title: apiEvent.title,
    slug: apiEvent.slug,
    description: apiEvent.description,
    category: apiEvent.category?.name || '',
    categoryImageUrl: apiEvent.category?.image_url || '',
    region: apiEvent.region?.name || '',
    division: apiEvent.division?.name || '',
    city: apiEvent.city?.name || '',
    venue: apiEvent.venue || '',
    latitude: apiEvent.latitude || '',
    longitude: apiEvent.longitude || '',
    startDate: apiEvent.start_date,
    endDate: apiEvent.end_date,
    registrationDeadline: apiEvent.registration_deadline,
    price: Number(apiEvent.price || 0),
    maximumParticipants: apiEvent.maximum_participants || '',
    organizer: apiEvent.organizer?.name || '',
    status: apiEvent.status || 'draft',
    visibility: apiEvent.visibility || 'public',
    views: apiEvent.views || 0,
    registrations: apiEvent.registrations_count || 0,
    bookmarks: apiEvent.bookmarks_count || 0,
    reports: apiEvent.reports_count || 0,
    recommendationScore: apiEvent.recommendation_score || 0,
    recommendationReasons: apiEvent.recommendation_reasons || [],
    popularity: apiEvent.views ? Math.min(100, Math.round(Number(apiEvent.views) / 10)) : 0,
    images: (apiEvent.images || []).map(normalizeImage),
    coverImage: (apiEvent.images || []).map(normalizeImage).find((image) => image.isCover) || null,
    raw: apiEvent,
  }
}

export function normalizeEvents(apiEvents = []) {
  return apiEvents.map(normalizeEvent).filter(Boolean)
}

export function eventToFormValues(event) {
  return {
    title: event?.title || '',
    description: event?.description || '',
    category_id: event?.categoryId ? String(event.categoryId) : '',
    region_id: event?.regionId ? String(event.regionId) : '',
    division_id: event?.divisionId ? String(event.divisionId) : '',
    city_id: event?.cityId ? String(event.cityId) : '',
    venue: event?.venue || '',
    latitude: event?.latitude || '',
    longitude: event?.longitude || '',
    startDate: toDateTimeLocal(event?.startDate),
    endDate: toDateTimeLocal(event?.endDate),
    registrationDeadline: toDateTimeLocal(event?.registrationDeadline),
    price: String(event?.price ?? 0),
    maximumParticipants: String(event?.maximumParticipants || 100),
    status: event?.status || 'draft',
    visibility: event?.visibility || 'public',
    existingCoverImage: event?.coverImage || null,
    existingGalleryImages: event?.images?.filter((image) => !image.isCover) || [],
  }
}

export function formValuesToApiPayload(form, status = 'pending') {
  return {
    title: form.title,
    description: form.description,
    category_id: Number(form.category_id),
    category_ids: [Number(form.category_id)],
    region_id: form.region_id ? Number(form.region_id) : null,
    division_id: null,
    city_id: form.city_id ? Number(form.city_id) : null,
    venue: form.venue || null,
    start_date: form.startDate,
    end_date: form.endDate || null,
    registration_deadline: form.registrationDeadline || null,
    price: Number(form.price || 0),
    maximum_participants: form.maximumParticipants ? Number(form.maximumParticipants) : null,
    status,
    visibility: form.visibility || 'public',
  }
}


export function extractEventFiles(form) {
  return {
    coverImage: form.coverImage || null,
    galleryImages: form.galleryImages || [],
  }
}

export function buildEventImagesFormData(files) {
  const formData = new FormData()

  if (files.coverImage) {
    formData.append('cover', files.coverImage)
  }

  Array.from(files.galleryImages || []).forEach((file) => {
    formData.append('gallery[]', file)
  })

  return formData
}

export function hasEventFiles(files) {
  return Boolean(files.coverImage || (files.galleryImages && files.galleryImages.length > 0))
}
