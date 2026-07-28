export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Mboa Events 237'
export const APP_TECHNICAL_NAME = 'MboaEvents237'
export const APP_TAGLINE = "Your gateway to Cameroon’s events."
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
// Base URL for stored files. After the S3 migration this points at the bucket/CDN
// (VITE_STORAGE_URL); falls back to the backend /storage path when unset.
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || `${API_BASE_URL.replace('/api', '')}/storage`
export const DEFAULT_LANGUAGE = 'en'
// Cache purge verification trigger - v1.0.2
