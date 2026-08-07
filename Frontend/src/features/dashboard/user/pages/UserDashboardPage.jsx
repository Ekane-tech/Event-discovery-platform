import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Bell, Bookmark, CalendarCheck, Heart, Ticket } from 'lucide-react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import StatCardSkeleton from '../../../../shared/components/feedback/StatCardSkeleton.jsx'
import { EventGridSkeleton } from '../../../events/components/EventCardSkeleton.jsx'
import EventGrid from '../../../events/components/EventGrid.jsx'
import { dashboardService } from '../../services/dashboardService.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { hasEventEnded } from '../../../events/utils/eventLifecycle.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../../shared/i18n/useTranslation.js'
import MetricCard from '../../../../shared/components/ui/MetricCard.jsx'

function StatCard({ title, value, to, icon: Icon }) {
  return <MetricCard label={title} value={value} icon={Icon} to={to} />
}

export default function UserDashboardPage() {
  const { t } = useTranslation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      setError('')
      try {
        const response = await dashboardService.getUserDashboard()
        setDashboard(response.data)
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, t('dashboard.user.loadError', 'Unable to load dashboard.')))
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (error) return <PageContainer><ErrorState title={t('dashboard.user.errorTitle', 'Dashboard error')} message={error} /></PageContainer>

  const summary = dashboard?.summary || {}
  const recommendedEvents = normalizeEvents(extractCollection(dashboard || {}, 'recommended_events')).filter(event => !hasEventEnded(event))
  const cards = [
    { title: t('dashboard.user.interests', 'Interests'), value: summary.interests_count || 0, to: '/my-interests', icon: Heart },
    { title: t('dashboard.user.recommendations', 'Recommendations'), value: summary.recommendations_count || 0, to: '/recommendations', icon: Heart },
    { title: t('dashboard.user.upcoming', 'Upcoming'), value: summary.upcoming_registrations_count || 0, to: '/registrations', icon: Ticket },
    { title: t('bookmarks.savedEvents', 'Bookmarks'), value: summary.bookmarks_count || 0, to: '/bookmarks', icon: Bookmark },
    { title: t('dashboard.user.unread', 'Unread'), value: summary.unread_notifications_count || 0, to: '/notifications', icon: Bell },
  ]

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-950">{t('dashboard.user.welcomeTitle', 'Your attendee space')}</h1>
        <div className="flex flex-wrap gap-2"><Link to="/events"><Button variant="light">{t('browseEvents', 'Browse Events')}</Button></Link><Link to="/interests"><Button className="bg-blue-500 text-white hover:bg-blue-600">{t('dashboard.user.updateInterests', 'Update Interests')}</Button></Link></div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {loading ? Array.from({ length: 5 }).map((_, index) => <StatCardSkeleton key={index} />) : cards.map((item) => <StatCard key={item.title} {...item} />)}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-slate-950">{t('dashboard.user.topRecommendations', 'Top recommendations')}</h2><p className="text-sm text-slate-600">{t('dashboard.user.topRecommendationsDesc', 'Personalized events based on your activity.')}</p></div><Link to="/recommendations" className="text-sm font-bold text-blue-700">{t('viewAll', 'View all')}</Link></div>
        {loading ? <EventGridSkeleton count={3} /> : recommendedEvents.length > 0 ? <EventGrid events={recommendedEvents.slice(0, 3)} /> : <Card><div className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-blue-700" /><p className="text-sm text-slate-600">{t('dashboard.user.noRecommendations', 'No recommendations yet. Select interests to improve recommendations.')}</p></div></Card>}
      </section>
    </PageContainer>
  )
}
