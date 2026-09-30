import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BarChart3, CalendarCheck, Eye, Plus, Ticket, Wallet } from 'lucide-react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import StatCardSkeleton from '../../../../shared/components/feedback/StatCardSkeleton.jsx'
import MetricCard from '../../../../shared/components/ui/MetricCard.jsx'
import { formatPrice } from '../../../../shared/utils/currency.js'
import { dashboardService } from '../../services/dashboardService.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { hasEventEnded } from '../../../events/utils/eventLifecycle.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function StatCard({ title, value, icon: Icon }) {
  return <MetricCard label={title} value={value} icon={Icon} />
}

const STATUS_STYLES = {
  published: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-700',
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status}
    </span>
  )
}

function eventDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function EventsTableSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

export default function OrganizerDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { async function run(){ try{ const r=await dashboardService.getOrganizerDashboard(); setDashboard(r.data) }catch(e){ setError(getApiErrorMessage(e,'Unable to load organizer dashboard.')) }finally{ setLoading(false) } } run() }, [])
  if (error) return <PageContainer><ErrorState title="Organizer dashboard error" message={error} /></PageContainer>
  const stats=dashboard?.summary||{}; const events=normalizeEvents(extractCollection(dashboard||{},'recent_events'))
  const cards=[['Events',stats.events_count||0,CalendarCheck,'from-blue-600 to-emerald-700'],['Registrations',stats.total_registrations||0,Ticket,'from-blue-600 to-indigo-700'],['Views',stats.total_views||0,Eye,'from-purple-600 to-violet-800'],['Revenue',Number(stats.revenue||0)===0?'0':formatPrice(stats.revenue),Wallet,'from-amber-500 to-orange-700']]
  return <PageContainer>
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-black text-slate-950">Organizer workspace</h1>
      <Link to="/organizer/events/create"><Button variant="light"><Plus className="mr-2 h-4 w-4"/>Create Event</Button></Link>
    </div>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{loading?Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>):cards.map(([title,value,Icon,gradient])=><StatCard key={title} title={title} value={value} icon={Icon} gradient={gradient}/>)}</div>
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950"><BarChart3 className="h-6 w-6 text-teal-700"/>Recent organizer events</h2>
        <Link to="/organizer/events" className="text-sm font-bold text-teal-700">View all</Link>
      </div>

      {loading ? (
        <EventsTableSkeleton />
      ) : events.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">No events yet. Create your first event to get started.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-center">Registrations</th>
                  <th className="hidden px-5 py-3 text-center md:table-cell">Views</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="transition hover:bg-slate-50">
                    <td className="max-w-[280px] px-5 py-3">
                      <p className="truncate font-bold text-slate-950">{event.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {event.city}{event.city && event.region ? ', ' : ''}{event.region}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{eventDate(event.startDate)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-800">{event.registrations}</td>
                    <td className="hidden px-5 py-3 text-center text-slate-600 md:table-cell">{event.views}</td>
                    <td className="px-5 py-3"><StatusPill status={event.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/organizer/events/${event.id}/details`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Details
                        </Link>
                        {!hasEventEnded(event) && (
                          <Link
                            to={`/organizer/events/${event.id}/edit`}
                            className="inline-flex items-center rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-600"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  </PageContainer>
}
