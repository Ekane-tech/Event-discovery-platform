import { useCallback, useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { extractCollection, normalizeEvents } from '../../events/utils/normalizeEvent.js'
import { recommendationService } from '../services/recommendationService.js'

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [recommendationSummary, setRecommendationSummary] = useState({ total: 0, interestBased: 0, locationBased: 0, activityBased: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await recommendationService.getRecommendations({ limit: 50 })
      setRecommendations(normalizeEvents(extractCollection(response.data, 'recommendations')))
      setRecommendationSummary({
        total: response.data.summary?.total || 0,
        interestBased: response.data.summary?.interest_based || 0,
        locationBased: response.data.summary?.location_based || 0,
        activityBased: response.data.summary?.activity_based || 0,
      })
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load recommendations.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const topRecommendations = useMemo(() => recommendations.slice(0, 6), [recommendations])

  return {
    recommendations,
    topRecommendations,
    recommendationSummary,
    loading,
    error,
    refetch: fetchRecommendations,
  }
}
