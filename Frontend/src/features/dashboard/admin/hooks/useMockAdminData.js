import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES } from '../../../../shared/constants/categories.js'
import { CAMEROON_REGIONS } from '../../../../shared/constants/regions.js'
import { mockEvents } from '../../../events/services/mockEvents.js'

const ADMIN_DATA_KEY = 'admin_management_data'
const ADMIN_DATA_UPDATED_EVENT = 'mock-admin-data-updated'

function createInitialAdminData() {
  return {
    users: [
      {
        id: 1,
        name: 'Demo User',
        email: 'user@example.com',
        role: 'user',
        city: 'Douala',
        region: 'Littoral',
        status: 'active',
        createdAt: '2026-07-01T08:00:00',
      },
      {
        id: 2,
        name: 'Demo Organizer',
        email: 'organizer@example.com',
        role: 'organizer',
        city: 'Douala',
        region: 'Littoral',
        status: 'pending_approval',
        createdAt: '2026-07-01T09:00:00',
      },
      {
        id: 3,
        name: 'Demo Admin',
        email: 'admin@example.com',
        role: 'admin',
        city: 'Yaoundé',
        region: 'Centre',
        status: 'active',
        createdAt: '2026-07-01T10:00:00',
      },
    ],
    events: mockEvents.map((event, index) => ({
      ...event,
      status: index % 4 === 0 ? 'pending' : index % 4 === 1 ? 'published' : index % 4 === 2 ? 'flagged' : 'draft',
      visibility: 'public',
      reports: index % 3 === 0 ? index + 1 : 0,
    })),
    categories: CATEGORIES.map((category, index) => ({
      id: index + 1,
      name: category,
      status: 'active',
      eventCount: Math.floor(Math.random() * 20),
    })),
    locations: CAMEROON_REGIONS.map((region, index) => ({
      id: index + 1,
      region,
      division: index === 4 ? 'Wouri' : index === 1 ? 'Mfoundi' : 'Main Division',
      city: index === 4 ? 'Douala' : index === 1 ? 'Yaoundé' : region,
      status: 'active',
    })),
    reports: [
      {
        id: 1,
        type: 'Fake event',
        target: 'Douala Tech Summit',
        reportedBy: 'user@example.com',
        status: 'open',
        createdAt: '2026-07-05T12:00:00',
      },
      {
        id: 2,
        type: 'Wrong location',
        target: 'Limbe Music Festival',
        reportedBy: 'organizer@example.com',
        status: 'reviewing',
        createdAt: '2026-07-05T14:30:00',
      },
    ],
    announcements: [
      {
        id: 1,
        title: 'Complete your interests',
        message: 'Users should select interests to receive personalized event notifications.',
        audience: 'users',
        status: 'draft',
        createdAt: '2026-07-06T08:00:00',
      },
    ],
  }
}

function readAdminData() {
  const stored = localStorage.getItem(ADMIN_DATA_KEY)

  if (stored) {
    return JSON.parse(stored)
  }

  const initialData = createInitialAdminData()
  localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(initialData))
  return initialData
}

export function useMockAdminData() {
  const [data, setData] = useState(() => readAdminData())

  useEffect(() => {
    function handleAdminDataUpdated() {
      setData(readAdminData())
    }

    window.addEventListener(ADMIN_DATA_UPDATED_EVENT, handleAdminDataUpdated)
    return () => window.removeEventListener(ADMIN_DATA_UPDATED_EVENT, handleAdminDataUpdated)
  }, [])

  function persistData(nextData) {
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(nextData))
    setData(nextData)
    window.dispatchEvent(new CustomEvent(ADMIN_DATA_UPDATED_EVENT))
  }

  function updateUserStatus(userId, status) {
    persistData({
      ...data,
      users: data.users.map((user) => Number(user.id) === Number(userId) ? { ...user, status } : user),
    })
  }

  function updateUserRole(userId, role) {
    persistData({
      ...data,
      users: data.users.map((user) => Number(user.id) === Number(userId) ? { ...user, role } : user),
    })
  }

  function updateEventStatus(eventId, status) {
    persistData({
      ...data,
      events: data.events.map((event) => Number(event.id) === Number(eventId) ? { ...event, status } : event),
    })
  }

  function removeEvent(eventId) {
    persistData({
      ...data,
      events: data.events.filter((event) => Number(event.id) !== Number(eventId)),
    })
  }

  function addCategory(name) {
    const cleanName = name.trim()
    if (!cleanName) return

    persistData({
      ...data,
      categories: [
        ...data.categories,
        { id: Date.now(), name: cleanName, status: 'active', eventCount: 0 },
      ],
    })
  }

  function toggleCategoryStatus(categoryId) {
    persistData({
      ...data,
      categories: data.categories.map((category) => (
        Number(category.id) === Number(categoryId)
          ? { ...category, status: category.status === 'active' ? 'disabled' : 'active' }
          : category
      )),
    })
  }

  function addLocation(payload) {
    if (!payload.region || !payload.city) return

    persistData({
      ...data,
      locations: [
        ...data.locations,
        { id: Date.now(), ...payload, status: 'active' },
      ],
    })
  }

  function toggleLocationStatus(locationId) {
    persistData({
      ...data,
      locations: data.locations.map((location) => (
        Number(location.id) === Number(locationId)
          ? { ...location, status: location.status === 'active' ? 'disabled' : 'active' }
          : location
      )),
    })
  }

  function updateReportStatus(reportId, status) {
    persistData({
      ...data,
      reports: data.reports.map((report) => Number(report.id) === Number(reportId) ? { ...report, status } : report),
    })
  }

  function createAnnouncement(payload) {
    if (!payload.title.trim() || !payload.message.trim()) return

    persistData({
      ...data,
      announcements: [
        {
          id: Date.now(),
          title: payload.title,
          message: payload.message,
          audience: payload.audience,
          status: payload.status,
          createdAt: new Date().toISOString(),
        },
        ...data.announcements,
      ],
    })
  }

  function updateAnnouncementStatus(announcementId, status) {
    persistData({
      ...data,
      announcements: data.announcements.map((announcement) => (
        Number(announcement.id) === Number(announcementId) ? { ...announcement, status } : announcement
      )),
    })
  }

  const stats = useMemo(() => {
    const organizersPending = data.users.filter((user) => user.role === 'organizer' && user.status === 'pending_approval').length
    const flaggedEvents = data.events.filter((event) => event.status === 'flagged' || Number(event.reports || 0) > 0).length
    const openReports = data.reports.filter((report) => report.status !== 'resolved').length
    const activeCategories = data.categories.filter((category) => category.status === 'active').length

    return {
      users: data.users.length,
      events: data.events.length,
      organizersPending,
      flaggedEvents,
      openReports,
      categories: activeCategories,
      locations: data.locations.length,
      announcements: data.announcements.length,
    }
  }, [data])

  return {
    ...data,
    stats,
    updateUserStatus,
    updateUserRole,
    updateEventStatus,
    removeEvent,
    addCategory,
    toggleCategoryStatus,
    addLocation,
    toggleLocationStatus,
    updateReportStatus,
    createAnnouncement,
    updateAnnouncementStatus,
  }
}