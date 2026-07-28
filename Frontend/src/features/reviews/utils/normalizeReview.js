import { API_BASE_URL, STORAGE_URL } from '../../../shared/constants/app.js'

function storageUrl(path) {
  if (!path) return ''
  if (String(path).startsWith('http')) return path
  return `${STORAGE_URL}/${path}`
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
