import { useEffect, useState } from 'react'
import { profileService } from '../services/profileService.js'
import { getApiErrorMessage, normalizeAuthUser } from '../../auth/utils/normalizeAuthUser.js'

export function useProfileApi() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchProfile() {
    setLoading(true)
    setError('')

    try {
      const response = await profileService.getProfile()
      const normalizedProfile = normalizeAuthUser(response.data.profile)
      setProfile(normalizedProfile)
      return normalizedProfile
    } catch (fetchError) {
      const message = getApiErrorMessage(fetchError, 'Unable to load profile.')
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile().catch(() => {})
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  }
}
