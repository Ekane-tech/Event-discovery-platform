import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { normalizeEvent, normalizeEvents, extractCollection } from '../../events/utils/normalizeEvent.js'
import { registrationService } from '../services/registrationService.js'

const REGISTRATIONS_UPDATED_EVENT = 'registrations-updated'

function normalizeRegistration(apiRegistration) {
  if (!apiRegistration) return null
  return {
    id: apiRegistration.id,
    eventId: Number(apiRegistration.event_id),
    status: apiRegistration.status,
    ticketNumber: apiRegistration.ticket_number,
    registrationDate: apiRegistration.registered_at || apiRegistration.created_at,
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

  useEffect(() => {
    fetchRegistrations()

    function handleRegistrationsUpdated() {
      fetchRegistrations()
    }

    window.addEventListener(REGISTRATIONS_UPDATED_EVENT, handleRegistrationsUpdated)
    return () => window.removeEventListener(REGISTRATIONS_UPDATED_EVENT, handleRegistrationsUpdated)
  }, [fetchRegistrations])

  function getRegistration(eventId) {
    return registrations.find((registration) => Number(registration.eventId) === Number(eventId))
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
