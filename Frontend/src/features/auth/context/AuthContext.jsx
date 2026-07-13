import { createContext, useEffect, useMemo, useState } from 'react'
import { ROLES } from '../../../shared/constants/roles.js'
import { profileService } from '../../profile/services/profileService.js'
import { authService } from '../services/authService.js'
import { getApiErrorMessage, normalizeAuthUser } from '../utils/normalizeAuthUser.js'

export const AuthContext = createContext(null)

const STORAGE_TOKEN_KEY = 'auth_token'
const STORAGE_USER_KEY = 'auth_user'

function saveSession(token, user) {
  localStorage.setItem(STORAGE_TOKEN_KEY, token)
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY)
  localStorage.removeItem(STORAGE_USER_KEY)
}

function toApiProfilePayload(currentUser, payload) {
  const merged = { ...currentUser, ...payload }

  return {
    name: merged.name,
    phone: merged.phone || null,
    city: merged.city || null,
    region: merged.region || null,
    bio: merged.bio || null,
    preferred_language: merged.preferredLanguage === 'French' ? 'fr' : 'en',
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrapAuth() {
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY)
      const storedUser = localStorage.getItem(STORAGE_USER_KEY)

      if (!storedToken) {
        setLoading(false)
        return
      }

      setToken(storedToken)

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          localStorage.removeItem(STORAGE_USER_KEY)
        }
      }

      try {
        const response = await authService.me()
        const normalizedUser = normalizeAuthUser(response.data.user)
        setUser(normalizedUser)
        saveSession(storedToken, normalizedUser)
      } catch {
        clearSession()
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  async function login({ email, password }) {
    try {
      const response = await authService.login({
        email,
        password,
        device_name: 'web',
      })

      const nextToken = response.data.token
      const normalizedUser = normalizeAuthUser(response.data.user)

      saveSession(nextToken, normalizedUser)
      setToken(nextToken)
      setUser(normalizedUser)

      return normalizedUser
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Invalid email or password.'))
    }
  }

  async function register(payload) {
    try {
      const response = await authService.register({
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        city: payload.city || null,
        organizer_name: payload.organizerName || null,
        terms_accepted: Boolean(payload.termsAccepted),
        account_type: payload.accountType || 'user',
        password: payload.password,
        password_confirmation: payload.passwordConfirmation,
        device_name: 'web',
      })

      const nextToken = response.data.token
      const normalizedUser = normalizeAuthUser(response.data.user)

      saveSession(nextToken, normalizedUser)
      setToken(nextToken)
      setUser(normalizedUser)

      return normalizedUser
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Registration failed.'))
    }
  }

  async function updateUserProfile(payload) {
    if (!user) {
      throw new Error('You must be logged in to update your profile.')
    }

    try {
      const response = await profileService.updateProfile(toApiProfilePayload(user, payload))
      const normalizedUser = normalizeAuthUser(response.data.profile)

      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser))
      setUser(normalizedUser)

      return normalizedUser
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to update profile.'))
    }
  }

  async function refreshUser() {
    const response = await authService.me()
    const normalizedUser = normalizeAuthUser(response.data.user)
    const currentToken = localStorage.getItem(STORAGE_TOKEN_KEY)

    if (currentToken) {
      saveSession(currentToken, normalizedUser)
    }

    setUser(normalizedUser)
    return normalizedUser
  }

  async function logout() {
    try {
      if (token) {
        await authService.logout()
      }
    } catch {
      // Even if the API logout fails, clear the frontend session.
    } finally {
      clearSession()
      setToken(null)
      setUser(null)
    }
  }

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    role: user?.role || ROLES.GUEST,
    login,
    register,
    updateUserProfile,
    refreshUser,
    logout,
  }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
