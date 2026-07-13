import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROLES } from '../../../shared/constants/roles.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { mockInterests } from '../services/mockInterests.js'
import { interestService } from '../services/interestService.js'

function normalizeInterest(interest) {
  return {
    id: Number(interest.id),
    name: interest.name,
    slug: interest.slug,
    description: interest.description || '',
    isActive: interest.is_active ?? interest.isActive ?? true,
    raw: interest,
  }
}

function getStorageKey(user) {
  return user?.email ? `selected_interests_${user.email}` : 'selected_interests_guest'
}

export function useInterests() {
  const { user, role, isAuthenticated } = useAuth()
  const storageKey = useMemo(() => getStorageKey(user), [user])
  const [interests, setInterests] = useState([])
  const [selectedInterestIds, setSelectedInterestIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const useApi = isAuthenticated && role === ROLES.USER

  const loadInterests = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (!useApi) {
        const storedInterests = localStorage.getItem(storageKey)
        setInterests(mockInterests.map((interest, index) => ({ ...interest, id: Number(index + 1) })))
        setSelectedInterestIds(storedInterests ? JSON.parse(storedInterests).map(Number) : [])
        return
      }

      const [interestsResponse, myInterestsResponse] = await Promise.all([
        interestService.getInterests(),
        interestService.getMyInterests(),
      ])

      const nextInterests = (interestsResponse.data.interests || []).map(normalizeInterest)
      const nextSelectedIds = (myInterestsResponse.data.interests || []).map((interest) => Number(interest.id))

      setInterests(nextInterests)
      setSelectedInterestIds(nextSelectedIds)
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load interests.'))
    } finally {
      setLoading(false)
      setSaved(false)
    }
  }, [storageKey, useApi])

  useEffect(() => {
    loadInterests()
  }, [loadInterests])

  function toggleInterest(interestId) {
    const numericInterestId = Number(interestId)
    setSaved(false)
    setSelectedInterestIds((current) => {
      if (current.includes(numericInterestId)) {
        return current.filter((id) => id !== numericInterestId)
      }

      return [...current, numericInterestId]
    })
  }

  function clearInterests() {
    setSaved(false)
    setSelectedInterestIds([])
  }

  async function saveInterests() {
    setSaving(true)
    setError('')

    try {
      if (useApi) {
        await interestService.syncMyInterests(selectedInterestIds)
      } else {
        localStorage.setItem(storageKey, JSON.stringify(selectedInterestIds))
      }

      setSaved(true)
      return selectedInterestIds
    } catch (saveError) {
      const message = getApiErrorMessage(saveError, 'Unable to save interests.')
      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }

  const selectedInterests = interests.filter((interest) => selectedInterestIds.includes(Number(interest.id)))

  return {
    interests,
    selectedInterestIds,
    selectedInterests,
    selectedCount: selectedInterestIds.length,
    loading,
    saving,
    saved,
    error,
    toggleInterest,
    clearInterests,
    saveInterests,
    refetch: loadInterests,
  }
}
