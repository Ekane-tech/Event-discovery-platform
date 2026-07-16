import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { normalizeEvent, normalizeEvents, extractCollection } from '../../events/utils/normalizeEvent.js'
import { registrationService } from '../services/registrationService.js'
import { useAuth } from '../../auth/hooks/useAuth.js'

const REGISTRATIONS_UPDATED_EVENT = 'registrations-updated'

function normalizeRegistration(apiRegistration) {
  if (!apiRegistration) return null
  return {
    id: apiRegistration.id,
    eventId: Number(apiRegistration.event_id),
    status: apiRegistration.status,
    ticketNumber: apiRegistration.ticket_number,
    registrationDate: apiRegistration.registered_at || apiRegistration.created_at,
    checkedInAt: apiRegistration.checked_in_at || null,
    checkedInBy: apiRegistration.checked_in_by_user?.name || apiRegistration.checked_in_by || '',
    event: apiRegistration.event ? normalizeEvent(apiRegistration.event) : null,
    payment: apiRegistration.payment || null,
    raw: apiRegistration,
  }
}

function normalizeRegistrations(apiRegistrations = []) {
  return apiRegistrations.map(normalizeRegistration).filter(Boolean)
}

export function useRegistrations() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await registrationService.getRegistrations({ per_page: 50 })
      setRegistrations(normalizeRegistrations(extractCollection(response.data, 'registrations')))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load registrations.'))
    } finally {
      setLoading(false)
    }
  }, [])

  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    fetchRegistrations()

    function handleRegistrationsUpdated() {
      fetchRegistrations()
    }

    window.addEventListener(REGISTRATIONS_UPDATED_EVENT, handleRegistrationsUpdated)
    return () => window.removeEventListener(REGISTRATIONS_UPDATED_EVENT, handleRegistrationsUpdated)
  }, [fetchRegistrations, isAuthenticated])

  function getRegistration(eventId) {
    const matches = registrations.filter((registration) => Number(registration.eventId) === Number(eventId))
    return matches.find((registration) => ['confirmed', 'pending_payment'].includes(registration.status)) || matches[0]
  }

  function isRegistered(eventId) {
    return getRegistration(eventId)?.status === 'confirmed'
  }

  async function registerForEvent(event) {
    const response = await registrationService.registerForEvent(event.id)
    const registration = normalizeRegistration(response.data.registration)
    window.dispatchEvent(new CustomEvent(REGISTRATIONS_UPDATED_EVENT))
    await fetchRegistrations()
    return registration
  }

  async function cancelRegistration(eventId) {
    await registrationService.cancelRegistration(eventId)
    window.dispatchEvent(new CustomEvent(REGISTRATIONS_UPDATED_EVENT))
    await fetchRegistrations()
  }

  const registeredEvents = registrations.map((registration) => (
    registration.event ? { ...registration.event, registration } : null
  )).filter(Boolean)

  return {
    registrations,
    registeredEvents,
    registrationCount: registrations.length,
    loading,
    error,
    getRegistration,
    isRegistered,
    registerForEvent,
    cancelRegistration,
    refetch: fetchRegistrations,
  }
}
