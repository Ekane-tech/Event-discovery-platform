import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, CalendarCheck, FolderTree, MapPin, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import AdminHero from '../components/AdminHero.jsx'
import AdminMetricCard from '../components/AdminMetricCard.jsx'
import { dashboardService } from '../../services/dashboardService.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(()=>{async function run(){try{const r=await dashboardService.getAdminDashboard();setDashboard(r.data)}catch(e){setError(getApiErrorMessage(e,'Unable to load admin dashboard.'))}finally{setLoading(false)}}run()},[])
  if(loading)return <PageContainer><Loader message="Loading admin dashboard..."/></PageContainer>
  if(error)return <PageContainer><ErrorState title="Admin dashboard error" message={error}/></PageContainer>
  const s=dashboard?.summary||{}
  const reports=dashboard?.recent_reports||[]
  const events=normalizeEvents(extractCollection(dashboard||{},'events_needing_review'))
  const metrics=[['Users',s.users_count||0,Users,'from-indigo-600 to-blue-700'],['Events',s.events_count||0,CalendarCheck,'from-teal-600 to-emerald-700'],['Organizers',s.organizers_count||0,ShieldCheck,'from-purple-600 to-violet-800'],['Open reports',s.open_reports_count||0,AlertTriangle,'from-rose-600 to-pink-700'],['Published',s.published_events_count||0,Bell,'from-green-600 to-teal-700'],['Categories',s.categories_count||0,FolderTree,'from-amber-500 to-orange-700'],['Regions',s.regions_count||0,MapPin,'from-cyan-600 to-blue-700'],['Registrations',s.registrations_count||0,MessageSquare,'from-slate-600 to-slate-800']]
  return <PageContainer><AdminHero title="System overview" description="Monitor users, events, reports, feedback and platform activity." action={<Link to="/admin/events"><Button variant="light">Moderate Events</Button></Link>} />
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label,value,Icon,gradient])=><AdminMetricCard key={label} label={label} value={value} icon={Icon} gradient={gradient}/>)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-slate-950">Recent reports</h2><Link to="/admin/reports" className="text-sm font-bold text-teal-700">View all</Link></div><div className="grid gap-3">{reports.length===0?<p className="text-sm text-slate-600">No reports yet.</p>:reports.slice(0,4).map(r=><div key={r.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-bold text-slate-950">{r.type}</p><p className="text-sm text-slate-600">{r.event?.title||'No event'} • {r.status}</p></div>)}</div></Card><Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-slate-950">Events needing attention</h2><Link to="/admin/events" className="text-sm font-bold text-teal-700">Manage</Link></div><div className="grid gap-3">{events.length===0?<p className="text-sm text-slate-600">No events need review.</p>:events.slice(0,4).map(e=><div key={e.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-bold text-slate-950">{e.title}</p><p className="text-sm text-slate-600">{e.category} • {e.status}</p></div>)}</div></Card></div>
    <div className="mt-8 flex flex-wrap gap-3"><Link to="/admin/users"><Button>Manage Users</Button></Link><Link to="/admin/feedback"><Button variant="secondary">Review Feedback</Button></Link><Link to="/admin/notifications"><Button variant="secondary">Send Announcement</Button></Link></div>
  </PageContainer>
}
