import { API_BASE_URL } from '../../../shared/constants/app.js'

function storageUrl(path) {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  const baseUrl = API_BASE_URL.replace('/api', '')
  return `${baseUrl}/storage/${path}`
}

export function normalizeReview(apiReview) {
  if (!apiReview) return null

  return {
    id: apiReview.id,
    eventId: apiReview.event_id,
    userId: apiReview.user_id,
    rating: Number(apiReview.rating) || 0,
    comment: apiReview.comment || '',
    createdAt: apiReview.created_at,
    updatedAt: apiReview.updated_at,
    authorName: apiReview.user?.name || '',
    authorAvatar: storageUrl(apiReview.user?.avatar),
  }
}
