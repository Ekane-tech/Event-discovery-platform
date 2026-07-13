import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import AdminStatGrid from '../components/AdminStatGrid.jsx'
import { dashboardService } from '../../services/dashboardService.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await dashboardService.getAdminDashboard()
        setDashboard(response.data)
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, 'Unable to load admin dashboard.'))
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <PageContainer><Loader message="Loading admin dashboard from Laravel..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Admin dashboard error" message={error} /></PageContainer>

  const stats = dashboard?.summary || {}
  const reports = dashboard?.recent_reports || []
  const events = normalizeEvents(extractCollection(dashboard || {}, 'events_needing_review'))
  const statCards = [
    { label: 'Users', value: stats.users_count || 0, description: 'Registered accounts' },
    { label: 'Events', value: stats.events_count || 0, description: 'Events in moderation' },
    { label: 'Organizers', value: stats.organizers_count || 0, description: 'Organizer accounts' },
    { label: 'Open reports', value: stats.open_reports_count || 0, description: 'Need review' },
    { label: 'Published events', value: stats.published_events_count || 0, description: 'Public events' },
    { label: 'Categories', value: stats.categories_count || 0, description: 'Categories' },
    { label: 'Locations', value: stats.regions_count || 0, description: 'Regions' },
    { label: 'Registrations', value: stats.registrations_count || 0, description: 'Event registrations' },
  ]

  return (
    <PageContainer>
      <SectionHeader title="Admin Dashboard" description="Moderate and manage the event discovery platform from Laravel." />
      <AdminStatGrid stats={statCards} />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-950">Recent reports</h2><Link to="/admin/reports" className="text-sm font-medium text-blue-700">View all</Link></div><div className="grid gap-3">{reports.length === 0 ? <p className="text-sm text-slate-600">No reports yet.</p> : reports.slice(0, 3).map((report) => <div key={report.id} className="rounded-xl border border-slate-200 p-3"><p className="font-medium text-slate-950">{report.type}</p><p className="text-sm text-slate-600">{report.event?.title || 'No event'} • {report.status}</p></div>)}</div></Card>
        <Card><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-950">Events needing attention</h2><Link to="/admin/events" className="text-sm font-medium text-blue-700">Manage</Link></div><div className="grid gap-3">{events.length === 0 ? <p className="text-sm text-slate-600">No events need review.</p> : events.slice(0, 3).map((event) => <div key={event.id} className="rounded-xl border border-slate-200 p-3"><p className="font-medium text-slate-950">{event.title}</p><p className="text-sm text-slate-600">{event.category} • {event.status}</p></div>)}</div></Card>
      </div>
      <div className="mt-8 flex flex-wrap gap-3"><Link to="/admin/users"><Button>Manage Users</Button></Link><Link to="/admin/events"><Button variant="secondary">Moderate Events</Button></Link><Link to="/admin/notifications"><Button variant="secondary">Send Announcement</Button></Link></div>
    </PageContainer>
  )
}
