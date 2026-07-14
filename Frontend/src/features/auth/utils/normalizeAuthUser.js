import { API_BASE_URL } from '../../../shared/constants/app.js'
import { ROLES } from '../../../shared/constants/roles.js'

function normalizeLanguage(language) {
  if (!language) return 'English'
  return language === 'fr' || language === 'French' ? 'French' : 'English'
}

function pickProfileValue(apiUser, key, fallback = '') {
  return apiUser?.profile?.[key] ?? apiUser?.[key] ?? fallback
}

function normalizeAvatarUrl(avatar) {
  if (!avatar) return ''
  const value = String(avatar).trim()
  if (!value || value === 'null' || value === 'undefined') return ''
  if (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')) return value
  const baseUrl = API_BASE_URL.replace('/api', '')
  return `${baseUrl}/storage/${value}`
}

export function normalizeAuthUser(apiUser) {
  if (!apiUser) return null

  const roleName = (typeof apiUser.role === 'string' ? apiUser.role : apiUser.role?.name)?.toLowerCase?.()
  const preferredLanguage = pickProfileValue(apiUser, 'preferred_language', apiUser?.preferredLanguage)
  const avatar = pickProfileValue(apiUser, 'avatar')

  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    status: apiUser.status || 'active',
    emailVerifiedAt: apiUser.email_verified_at || null,
    role: roleName || ROLES.USER,
    roleData: typeof apiUser.role === 'object' ? apiUser.role : null,
    organizationName: pickProfileValue(apiUser, 'organization_name'),
    phone: pickProfileValue(apiUser, 'phone'),
    city: pickProfileValue(apiUser, 'city'),
    region: pickProfileValue(apiUser, 'region'),
    avatar: normalizeAvatarUrl(avatar),
    bio: pickProfileValue(apiUser, 'bio'),
    preferredLanguage: normalizeLanguage(preferredLanguage),
    raw: apiUser,
  }
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data

  if (data?.message) return data.message

  if (data?.errors) {
    const firstError = Object.values(data.errors)?.[0]?.[0]
    if (firstError) return firstError
  }

  return error?.message || fallback
}
