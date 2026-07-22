import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import NotificationItem from './NotificationItem.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function NotificationList({ notifications = [], onMarkAsRead }) {
  const { t } = useTranslation()
  if (notifications.length === 0) {
    return (
      <EmptyState
        title={t('notifications.noNotificationsTitle', 'No notifications yet')}
        message={t('notifications.noNotificationsMessage', 'Choose your interests to start receiving personalized event notifications.')}
      />
    )
  }

  return (
    <div className="grid gap-4">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} />
      ))}
    </div>
  )
}
