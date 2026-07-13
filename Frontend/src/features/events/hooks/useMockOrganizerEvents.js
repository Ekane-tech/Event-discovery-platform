import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { mockEvents } from '../services/mockEvents.js'

const ORGANIZER_EVENTS_UPDATED_EVENT = 'mock-organizer-events-updated'

function getStorageKey(user) {
  return user?.email ? `organizer_events_${user.email}` : 'organizer_events_guest'
}

function createSeedEvents(user) {
  const organizerName = user?.name || 'Demo Organizer'
  const organizerEmail = user?.email || 'organizer@example.com'

  return mockEvents.slice(0, 3).map((event, index) => ({
    ...event,
    id: `seed-${event.id}`,
    sourceEventId: event.id,
    organizer: organizerName,
    organizerEmail,
    status: index === 0 ? 'published' : index === 1 ? 'pending' : 'draft',
    visibility: 'public',
    maximumParticipants: index === 0 ? 500 : 200,
    registrationDeadline: event.startDate,
    endDate: event.startDate,
    createdAt: '2026-07-01T09:00:00',
    updatedAt: '2026-07-01T09:00:00',
  }))
}

function readEvents(storageKey, user) {
  const storedEvents = localStorage.getItem(storageKey)

  if (storedEvents) {
    return JSON.parse(storedEvents)
  }

  const seedEvents = createSeedEvents(user)
  localStorage.setItem(storageKey, JSON.stringify(seedEvents))
  return seedEvents
}

export function useMockOrganizerEvents() {
  const { user } = useAuth()
  const storageKey = useMemo(() => getStorageKey(user), [user])
  const [events, setEvents] = useState([])

  useEffect(() => {
    setEvents(readEvents(storageKey, user))

    function handleOrganizerEventsUpdated(event) {
      if (!event.detail?.storageKey || event.detail.storageKey === storageKey) {
        setEvents(readEvents(storageKey, user))
      }
    }

    window.addEventListener(ORGANIZER_EVENTS_UPDATED_EVENT, handleOrganizerEventsUpdated)

    return () => window.removeEventListener(ORGANIZER_EVENTS_UPDATED_EVENT, handleOrganizerEventsUpdated)
  }, [storageKey, user])

  function persistEvents(nextEvents) {
    localStorage.setItem(storageKey, JSON.stringify(nextEvents))
    setEvents(nextEvents)
    window.dispatchEvent(new CustomEvent(ORGANIZER_EVENTS_UPDATED_EVENT, { detail: { storageKey } }))
  }

  function createEvent(payload) {
    const now = new Date().toISOString()
    const event = {
      ...payload,
      id: `local-${Date.now()}`,
      price: Number(payload.price || 0),
      maximumParticipants: Number(payload.maximumParticipants || 0),
      organizer: user?.name || 'Demo Organizer',
      organizerEmail: user?.email || 'organizer@example.com',
      popularity: 0,
      views: 0,
      registrations: 0,
      createdAt: now,
      updatedAt: now,
    }

    persistEvents([event, ...events])
    return event
  }

  function updateEvent(eventId, payload) {
    const nextEvents = events.map((event) => {
      if (String(event.id) !== String(eventId)) return event

      return {
        ...event,
        ...payload,
        price: Number(payload.price || 0),
        maximumParticipants: Number(payload.maximumParticipants || 0),
        updatedAt: new Date().toISOString(),
      }
    })

    persistEvents(nextEvents)
    return nextEvents.find((event) => String(event.id) === String(eventId))
  }

  function deleteEvent(eventId) {
    persistEvents(events.filter((event) => String(event.id) !== String(eventId)))
  }

  function updateStatus(eventId, status) {
    const event = events.find((item) => String(item.id) === String(eventId))
    if (!event) return null
    return updateEvent(eventId, { ...event, status })
  }

  function getEvent(eventId) {
    return events.find((event) => String(event.id) === String(eventId))
  }

  const stats = useMemo(() => {
    const totalRegistrations = events.reduce((sum, event) => sum + Number(event.registrations || 0), 0)
    const totalViews = events.reduce((sum, event) => sum + Number(event.views || 0), 0)
    const revenue = events.reduce((sum, event) => sum + (Number(event.price || 0) * Number(event.registrations || 0)), 0)
    const published = events.filter((event) => event.status === 'published').length
    const pending = events.filter((event) => event.status === 'pending').length
    const drafts = events.filter((event) => event.status === 'draft').length

    return {
      totalEvents: events.length,
      published,
      pending,
      drafts,
      totalRegistrations,
      totalViews,
      revenue,
      attendanceRate: totalRegistrations > 0 ? Math.min(100, Math.round((totalRegistrations / Math.max(1, events.reduce((sum, event) => sum + Number(event.maximumParticipants || 0), 0))) * 100)) : 0,
    }
  }, [events])

  return {
    events,
    stats,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
  }
}