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
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function StatCard({ title, value, to, icon: Icon, gradient, iconBg }) {
  return (
    <Link to={to}>
      <div className={`relative h-full overflow-hidden rounded-3xl p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${gradient}`}>
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
        <div className="relative flex items-center justify-between">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}><Icon className="h-5 w-5" /></span>
          <span className="text-2xl font-black md:text-3xl">{value}</span>
        </div>
        <h3 className="relative mt-5 font-bold text-white/95">{title}</h3>
      </div>
    </Link>
  )
}

export default function UserDashboardPage() {
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
        setError(getApiErrorMessage(fetchError, 'Unable to load dashboard.'))
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (error) return <PageContainer><ErrorState title="Dashboard error" message={error} /></PageContainer>

  const summary = dashboard?.summary || {}
  const recommendedEvents = normalizeEvents(extractCollection(dashboard || {}, 'recommended_events'))
  const cards = [
    { title: 'Interests', value: summary.interests_count || 0, to: '/my-interests', icon: Heart, gradient: 'bg-gradient-to-br from-pink-600 to-rose-700', iconBg: 'bg-white/20' },
    { title: 'Recommendations', value: summary.recommendations_count || 0, to: '/recommendations', icon: Heart, gradient: 'bg-gradient-to-br from-teal-600 to-emerald-700', iconBg: 'bg-white/20' },
    { title: 'Upcoming', value: summary.upcoming_registrations_count || 0, to: '/registrations', icon: Ticket, gradient: 'bg-gradient-to-br from-blue-600 to-indigo-700', iconBg: 'bg-white/20' },
    { title: 'Bookmarks', value: summary.bookmarks_count || 0, to: '/bookmarks', icon: Bookmark, gradient: 'bg-gradient-to-br from-yellow-500 to-orange-600', iconBg: 'bg-white/25' },
    { title: 'Unread', value: summary.unread_notifications_count || 0, to: '/notifications', icon: Bell, gradient: 'bg-gradient-to-br from-purple-600 to-violet-800', iconBg: 'bg-white/20' },
  ]

  return (
    <PageContainer>

      <section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.88), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">Your attendee space</span>
        <h1 className="mt-5 max-w-3xl text-4xl font-black md:text-5xl">Welcome back. Your next event is waiting.</h1>
        <p className="mt-4 max-w-2xl text-slate-200">Track tickets, saved events, notifications and recommendations in one place.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/events"><Button variant="light">Browse Events</Button></Link><Link to="/interests"><Button className="bg-teal-500 text-white hover:bg-teal-600">Update Interests</Button></Link></div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        {loading ? Array.from({ length: 5 }).map((_, index) => <StatCardSkeleton key={index} />) : cards.map((item) => <StatCard key={item.title} {...item} />)}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black text-slate-950">Top recommendations</h2><p className="text-sm text-slate-600">Personalized events based on your activity.</p></div><Link to="/recommendations" className="text-sm font-bold text-teal-700">View all</Link></div>
        {loading ? <EventGridSkeleton count={3} /> : recommendedEvents.length > 0 ? <EventGrid events={recommendedEvents.slice(0, 3)} /> : <Card><div className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-teal-700" /><p className="text-sm text-slate-600">No recommendations yet. Select interests to improve recommendations.</p></div></Card>}
      </section>
    </PageContainer>
  )
}
