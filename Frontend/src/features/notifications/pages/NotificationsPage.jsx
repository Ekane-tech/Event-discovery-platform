import { Bell, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { ROLES } from '../../../shared/constants/roles.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import NotificationList from '../components/NotificationList.jsx'
import { useNotifications } from '../hooks/useNotifications.js'

export default function NotificationsPage() {
  const { role } = useAuth()
  const { notifications, unreadCount, totalCount, loading, error, markAsRead, markAllAsRead } = useNotifications()

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.9), rgba(37,99,235,.58)), url(/hero-events.svg)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100"><Bell className="h-4 w-4" /> Notifications</span>
        <h1 className="mt-5 text-4xl font-black md:text-5xl">Stay informed</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Important event updates, recommendations, platform announcements, and account alerts.</p>
      </section>

      <Card className="my-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-bold text-slate-950">Notification summary</h2><p className="mt-1 text-sm text-slate-600">{unreadCount} unread from {totalCount} total notifications.</p></div>
          <div className="flex flex-wrap gap-2">{role === ROLES.USER && <Link to="/interests"><Button variant="secondary">Update Interests</Button></Link>}<Button type="button" onClick={markAllAsRead} disabled={unreadCount === 0}><CheckCheck className="mr-2 h-4 w-4" /> Mark all read</Button></div>
        </div>
      </Card>
      {loading && <Loader message="Loading notifications..." />}
      {error && <ErrorState title="Unable to load notifications" message={error} />}
      {!loading && !error && <NotificationList notifications={notifications} onMarkAsRead={markAsRead} />}
    </PageContainer>
  )
}
