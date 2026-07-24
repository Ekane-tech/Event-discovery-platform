import { API_BASE_URL } from '../constants/app.js'

/**
 * Build a URL to a backend-generated image variant (resized on demand, cached).
 * Only for images stored on the public disk (a relative path), not external URLs.
 */
export function variantUrl(path, width) {
  return `${API_BASE_URL}/img?path=${encodeURIComponent(path)}&w=${width}`
}

/**
 * Returns a responsive `srcset` for a stored image path (400/800/1200 px),
 * or undefined for external/missing paths (so the browser just uses `src`).
 */
export function variantSrcSet(path) {
  if (!path) return undefined
  const value = String(path)
  if (value.startsWith('http') || value.startsWith('/')) return undefined

  return [
    `${variantUrl(value, 400)} 400w`,
    `${variantUrl(value, 800)} 800w`,
    `${variantUrl(value, 1200)} 1200w`,
  ].join(', ')
}
