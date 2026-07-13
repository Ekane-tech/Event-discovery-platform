import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { notificationPreferenceService } from '../services/notificationPreferenceService.js'

const defaultPreferences = {
  interestMatches: true,
  eventReminders: true,
  organizerAnnouncements: true,
  adminMessages: true,
  email: true,
  sms: false,
  push: false,
  database: true,
}

function fromApi(apiPreferences = {}) {
  return {
    interestMatches: apiPreferences.interest_matches ?? true,
    eventReminders: apiPreferences.event_reminders ?? true,
    organizerAnnouncements: apiPreferences.organizer_announcements ?? true,
    adminMessages: apiPreferences.admin_messages ?? true,
    database: apiPreferences.database ?? true,
    email: apiPreferences.email ?? true,
    sms: apiPreferences.sms ?? false,
    push: apiPreferences.push ?? false,
  }
}

function toApi(preferences) {
  return {
    interest_matches: Boolean(preferences.interestMatches),
    event_reminders: Boolean(preferences.eventReminders),
    organizer_announcements: Boolean(preferences.organizerAnnouncements),
    admin_messages: Boolean(preferences.adminMessages),
    database: Boolean(preferences.database),
    email: Boolean(preferences.email),
    sms: Boolean(preferences.sms),
    push: Boolean(preferences.push),
  }
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function fetchPreferences() {
    setLoading(true)
    setError('')
    try {
      const response = await notificationPreferenceService.getPreferences()
      setPreferences(fromApi(response.data.preferences))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load notification preferences.'))
    } finally {
      setLoading(false)
      setSaved(false)
    }
  }

  useEffect(() => { fetchPreferences() }, [])

  function togglePreference(name) {
    setSaved(false)
    setPreferences((current) => ({ ...current, [name]: !current[name] }))
  }

  async function savePreferences() {
    setSaving(true)
    setError('')
    try {
      const response = await notificationPreferenceService.updatePreferences(toApi(preferences))
      setPreferences(fromApi(response.data.preferences))
      setSaved(true)
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to save notification preferences.'))
    } finally {
      setSaving(false)
    }
  }

  return {
    preferences,
    loading,
    saving,
    saved,
    error,
    togglePreference,
    savePreferences,
    refetch: fetchPreferences,
  }
}
