import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'
import { notificationService } from '../services/notificationService.js'
import { useAuth } from '../../auth/hooks/useAuth.js'

const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated'

function normalizeNotification(apiNotification) {
  const data = apiNotification.data || {}
  return {
    id: apiNotification.id,
    type: data.notification_kind || apiNotification.type,
    title: data.title || 'Notification',
    message: data.message || '',
    category: data.category_name || '',
    city: data.city_name || '',
    region: data.region_name || '',
    eventId: data.event_id || null,
    feedbackId: data.feedback_id || null,
    status: data.status,
    visibility: data.visibility,
    reason: data.reason || '',
    read: apiNotification.is_read ?? Boolean(apiNotification.read_at),
    readAt: apiNotification.read_at,
    createdAt: apiNotification.created_at,
    raw: apiNotification,
  }
}

function normalizeNotifications(apiNotifications = []) {
  return apiNotifications.map(normalizeNotification)
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await notificationService.getNotifications({ per_page: 50 })
      setNotifications(normalizeNotifications(extractCollection(response.data, 'notifications')))
      setUnreadCount(Number(response.data.unread_count || 0))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load notifications.'))
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
    fetchNotifications()

    function handleNotificationsUpdated() {
      fetchNotifications()
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated)
  }, [fetchNotifications, isAuthenticated])

  async function markAsRead(notificationId) {
    await notificationService.markAsRead(notificationId)
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT))
    await fetchNotifications()
  }

  async function markAllAsRead() {
    await notificationService.markAllAsRead()
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT))
    await fetchNotifications()
  }

  function markAllAsUnread() {
    // Laravel endpoint not implemented intentionally.
  }

  return {
    notifications,
    unreadCount,
    totalCount: notifications.length,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    markAllAsUnread,
    refetch: fetchNotifications,
  }
}