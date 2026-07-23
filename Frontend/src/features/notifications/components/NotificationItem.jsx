import { useState } from 'react'
import { Bell, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../../shared/components/ui/Badge.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function NotificationItem({ notification, onMarkAsRead }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const isLong = (notification.message?.length || 0) > 160
  const typeLabels = {
    interest_match: t('notifications.type.interestMatch', 'Interest match'),
    event_unavailable: t('notifications.type.eventUnavailable', 'Event update'),
    event_available: t('notifications.type.eventAvailable', 'Event available'),
    organizer_event_moderation: t('notifications.type.eventModeration', 'Event moderation'),
    app_feedback_submitted: t('notifications.type.platformFeedback', 'Platform feedback'),
    admin_announcement: t('notifications.type.announcement', 'Announcement'),
    reminder: t('notifications.type.reminder', 'Reminder'),
    system: t('notifications.type.system', 'System'),
  }
  return (
    <article className={`rounded-3xl border p-5 transition hover:shadow-lg ${notification.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700"><Bell className="h-5 w-5" /></span>
            <Badge className={notification.read ? 'bg-slate-100 text-slate-700' : ''}>{typeLabels[notification.type] || notification.type}</Badge>
            {notification.category && <Badge>{notification.category}</Badge>}
            {!notification.read && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{t('notifications.newBadge', 'New')}</span>}
          </div>
          <h3 className="font-black text-slate-950">{notification.title}</h3>
          <p className={`mt-2 text-sm leading-6 text-slate-600 ${!expanded && isLong ? 'line-clamp-3' : ''}`}>{notification.message}</p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((current) => !current)} className="mt-1 text-xs font-bold text-teal-700 hover:text-teal-800">
              {expanded ? t('notifications.showLess', 'Show less') : t('notifications.readMore', 'Read more')}
            </button>
          )}
          {notification.reason && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>{t('notifications.reason', 'Reason:')}</strong> {notification.reason}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{formatDate(notification.createdAt)}</span>{notification.city && <span>{notification.city}, {notification.region}</span>}</div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {notification.eventId && notification.type !== 'event_unavailable' && <Link to={`/events/${notification.eventId}`}><Button variant="secondary"><ExternalLink className="mr-2 h-4 w-4" />{t('notifications.viewEvent', 'View Event')}</Button></Link>}
          {notification.feedbackId && <Link to="/admin/feedback"><Button variant="secondary">{t('notifications.viewFeedback', 'View Feedback')}</Button></Link>}
          {!notification.read && <Button type="button" variant="outline" onClick={() => onMarkAsRead(notification.id)}>{t('notifications.markAsRead', 'Mark as read')}</Button>}
        </div>
      </div>
    </article>
  )
}
