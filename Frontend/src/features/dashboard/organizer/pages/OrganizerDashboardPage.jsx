import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BarChart3, CalendarCheck, Eye, Plus, Ticket, Wallet } from 'lucide-react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import StatCardSkeleton from '../../../../shared/components/feedback/StatCardSkeleton.jsx'
import { formatPrice } from '../../../../shared/utils/currency.js'
import { dashboardService } from '../../services/dashboardService.js'
import { extractCollection, normalizeEvents } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function StatCard({ title, value, icon: Icon, gradient }) {
  return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15"/><span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Icon className="h-5 w-5"/></span><p className="relative mt-4 text-sm text-white/80">{title}</p><p className="relative mt-1 text-2xl font-black md:text-3xl">{value}</p></div>
}

export default function OrganizerDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { async function run(){ try{ const r=await dashboardService.getOrganizerDashboard(); setDashboard(r.data) }catch(e){ setError(getApiErrorMessage(e,'Unable to load organizer dashboard.')) }finally{ setLoading(false) } } run() }, [])
  if (error) return <PageContainer><ErrorState title="Organizer dashboard error" message={error} /></PageContainer>
  const stats=dashboard?.summary||{}; const events=normalizeEvents(extractCollection(dashboard||{},'recent_events'))
  const cards=[['Events',stats.events_count||0,CalendarCheck,'from-teal-600 to-emerald-700'],['Registrations',stats.total_registrations||0,Ticket,'from-blue-600 to-indigo-700'],['Views',stats.total_views||0,Eye,'from-purple-600 to-violet-800'],['Revenue',Number(stats.revenue||0)===0?'0':formatPrice(stats.revenue),Wallet,'from-amber-500 to-orange-700']]
  return <PageContainer><section className="overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{backgroundImage:'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)'}}><span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">Organizer workspace</span><h1 className="mt-5 text-4xl font-black md:text-5xl">Manage events that people remember.</h1><p className="mt-3 max-w-2xl text-slate-200">Create events, track registrations, review performance and manage your audience.</p><div className="mt-6"><Link to="/organizer/events/create"><Button variant="light"><Plus className="mr-2 h-4 w-4"/>Create Event</Button></Link></div></section><div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">{loading?Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>):cards.map(([title,value,Icon,gradient])=><StatCard key={title} title={title} value={value} icon={Icon} gradient={gradient}/>)}</div><section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-2xl font-black text-slate-950"><BarChart3 className="h-6 w-6 text-teal-700"/>Recent organizer events</h2><Link to="/organizer/events" className="text-sm font-bold text-teal-700">View all</Link></div><div className="grid gap-4">{loading?Array.from({length:3}).map((_,i)=><Card key={i} className="h-24 animate-pulse bg-slate-100"/>):events.map(event=><Card key={event.id}><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="font-black text-slate-950">{event.title}</h3><p className="text-sm text-slate-600">{event.city}, {event.region} • {event.status}</p></div><div className="flex gap-2"><Link to={`/organizer/events/${event.id}/details`}><Button variant="secondary">Details</Button></Link><Link to={`/organizer/events/${event.id}/edit`}><Button>Edit</Button></Link></div></div></Card>)}</div></section></PageContainer>
}
