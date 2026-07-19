import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  Eye,
  Radio,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import StatCardSkeleton from '../../../../shared/components/feedback/StatCardSkeleton.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../../shared/utils/currency.js'
import { dashboardService } from '../../services/dashboardService.js'
import { eventService } from '../../../events/services/eventService.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function MetricCard({ label, value, icon: Icon, gradient, description }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
      <div className="absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-black/10" />

      <div className="relative flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-3xl font-black">{value}</span>
      </div>

      <p className="relative mt-5 text-sm font-bold text-white/90">{label}</p>
      {description && (
        <p className="relative mt-1 text-xs text-white/75">{description}</p>
      )}
    </div>
  )
}

function ProgressBar({ label, value, total, color = 'bg-teal-600' }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-medium text-slate-500">
          {value} of {total || 0} · {percent}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function InsightItem({ children }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-black text-teal-700">
        ✓
      </span>
      <span>{children}</span>
    </li>
  )
}

function TopEventRow({ event, rank }) {
  const score = Number(event.registrations || 0) + Number(event.bookmarks || 0) + Number(event.views || 0)

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-lg font-black text-teal-700">
          #{rank}
        </span>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">{event.title}</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
              {event.status}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-600">
            {formatDate(event.startDate)}
          </p>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-4 md:min-w-[440px]">
        <span>
          <strong className="text-slate-950">{event.registrations || 0}</strong>{' '}
          registrations
        </span>
        <span>
          <strong className="text-slate-950">{event.bookmarks || 0}</strong>{' '}
          bookmarks
        </span>
        <span>
          <strong className="text-slate-950">{event.views || 0}</strong> views
        </span>
        <span>
          <strong className="text-slate-950">{score}</strong> score
        </span>
      </div>
    </div>
  )
}

export default function OrganizerStatisticsPage() {
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStatistics() {
      setLoading(true)
      setError('')

      try {
        const [dashboardResponse, eventsResponse] = await Promise.all([
          dashboardService.getOrganizerDashboard(),
          eventService.getOrganizerEvents({ per_page: 100 }),
        ])

        setDashboard(dashboardResponse.data)
        setEvents(normalizeEvents(extractCollection(eventsResponse.data, 'events')))
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, 'Unable to load organizer statistics.'))
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const stats = dashboard?.summary || {}

  const statusStats = useMemo(() => ({
    published: events.filter((event) => event.status === 'published').length,
    pending: events.filter((event) => event.status === 'pending').length,
    draft: events.filter((event) => event.status === 'draft').length,
    rejected: events.filter((event) => event.status === 'rejected').length,
    cancelled: events.filter((event) => event.status === 'cancelled').length,
  }), [events])

  const topEvents = useMemo(() => [...events]
    .sort((a, b) => {
      const scoreA = Number(a.registrations || 0) + Number(a.bookmarks || 0) + Number(a.views || 0)
      const scoreB = Number(b.registrations || 0) + Number(b.bookmarks || 0) + Number(b.views || 0)
      return scoreB - scoreA
    })
    .slice(0, 5), [events])

  if (error) {
    return (
      <PageContainer>
        <ErrorState title="Unable to load statistics" message={error} />
      </PageContainer>
    )
  }

  const totalEvents = events.length

  const metrics = [
    {
      label: 'Total events',
      value: stats.events_count || totalEvents,
      icon: CalendarCheck,
      gradient: 'from-teal-600 to-emerald-700',
      description: 'All events you created',
    },
    {
      label: 'Published',
      value: stats.published_events_count || 0,
      icon: Radio,
      gradient: 'from-green-600 to-teal-700',
      description: 'Visible to attendees',
    },
    {
      label: 'Registrations',
      value: stats.total_registrations || 0,
      icon: Ticket,
      gradient: 'from-blue-600 to-indigo-700',
      description: 'Total attendee signups',
    },
    {
      label: 'Views',
      value: stats.total_views || 0,
      icon: Eye,
      gradient: 'from-purple-600 to-violet-800',
      description: 'Unique event views',
    },
    {
      label: 'Revenue',
      value: Number(stats.revenue || 0) === 0 ? '0' : formatPrice(stats.revenue),
      icon: Wallet,
      gradient: 'from-amber-500 to-orange-700',
      description: 'Estimated paid registrations',
    },
    {
      label: 'Attendance rate',
      value: `${stats.attendance_rate || 0}%`,
      icon: Activity,
      gradient: 'from-pink-600 to-rose-700',
      description: 'Confirmed registrations vs capacity',
    },
  ]

  return (
    <PageContainer>
      <section
        className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)',
        }}
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">
          <TrendingUp className="h-4 w-4" />
          Organizer insights
        </span>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-5xl">Event statistics</h1>
            <p className="mt-3 max-w-2xl text-slate-200">
              Track visibility, registrations, revenue potential, moderation status and your best-performing events.
            </p>
          </div>

          <Link to="/organizer/events">
            <Button variant="light">Manage Events</Button>
          </Link>
        </div>
      </section>

      <section className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        )}
      </section>

      {!loading && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-black text-slate-950">
              <BarChart3 className="h-5 w-5 text-teal-700" />
              Event status distribution
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              See how your events are distributed across moderation and publishing states.
            </p>

            <div className="grid gap-5">
              <ProgressBar
                label="Published"
                value={statusStats.published}
                total={totalEvents}
                color="bg-green-600"
              />
              <ProgressBar
                label="Pending"
                value={statusStats.pending}
                total={totalEvents}
                color="bg-amber-500"
              />
              <ProgressBar
                label="Draft"
                value={statusStats.draft}
                total={totalEvents}
                color="bg-slate-500"
              />
              <ProgressBar
                label="Rejected"
                value={statusStats.rejected}
                total={totalEvents}
                color="bg-red-600"
              />
              <ProgressBar
                label="Cancelled"
                value={statusStats.cancelled}
                total={totalEvents}
                color="bg-pink-600"
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-xl font-black text-slate-950">
              What this page helps you track
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Use these insights to improve promotion, planning and attendee conversion.
            </p>

            <ul className="grid gap-3">
              <InsightItem>
                Which events are visible, pending, rejected or cancelled.
              </InsightItem>
              <InsightItem>
                How many attendees are registering for your events.
              </InsightItem>
              <InsightItem>
                How much attention your events receive through views and bookmarks.
              </InsightItem>
              <InsightItem>
                Estimated revenue from paid registrations.
              </InsightItem>
              <InsightItem>
                Which events deserve more promotion or improvement.
              </InsightItem>
            </ul>
          </Card>
        </section>
      )}

      {!loading && (
        <Card className="mt-8">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Top performing events
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ranked by registrations, bookmarks and views.
              </p>
            </div>

            <Link to="/organizer/events" className="text-sm font-bold text-teal-700">
              View all events
            </Link>
          </div>

          {topEvents.length === 0 ? (
            <p className="text-sm text-slate-600">No events available yet.</p>
          ) : (
            <div className="grid gap-3">
              {topEvents.map((event, index) => (
                <TopEventRow key={event.id} event={event} rank={index + 1} />
              ))}
            </div>
          )}
        </Card>
      )}
    </PageContainer>
  )
}