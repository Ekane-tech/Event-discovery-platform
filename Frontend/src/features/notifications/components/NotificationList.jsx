import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import NotificationItem from './NotificationItem.jsx'

export default function NotificationList({ notifications = [], onMarkAsRead }) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        message="Choose your interests to start receiving personalized event notifications."
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