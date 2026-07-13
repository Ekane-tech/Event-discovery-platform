import { CalendarCheck, Clock, FileText, Plus, Radio } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import StatCardSkeleton from '../../../shared/components/feedback/StatCardSkeleton.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import OrganizerEventCard from '../components/OrganizerEventCard.jsx'
import { eventService } from '../services/eventService.js'
import { extractCollection, normalizeEvents } from '../utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'

function StatusCard({ label, value, icon: Icon, gradient }) { return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15"/><Icon className="relative h-6 w-6"/><p className="relative mt-3 text-3xl font-black">{value}</p><p className="relative text-sm text-white/85">{label}</p></div> }

export default function MyEventsPage() {
  const [events,setEvents]=useState([]); const[loading,setLoading]=useState(true); const[error,setError]=useState('')
  async function fetchEvents(){setLoading(true);setError('');try{const r=await eventService.getOrganizerEvents({per_page:50});setEvents(normalizeEvents(extractCollection(r.data,'events')))}catch(e){setError(getApiErrorMessage(e,'Unable to load organizer events.'))}finally{setLoading(false)}}
  useEffect(()=>{fetchEvents()},[])
  const stats=useMemo(()=>({total:events.length,published:events.filter(e=>e.status==='published').length,pending:events.filter(e=>e.status==='pending').length,drafts:events.filter(e=>e.status==='draft').length}),[events])
  async function handleDelete(eventId){if(!window.confirm('Are you sure you want to delete this event?'))return;try{await eventService.deleteEvent(eventId);await fetchEvents()}catch(e){setError(getApiErrorMessage(e,'Unable to delete event.'))}}
  return <PageContainer><section className="mb-6 rounded-3xl bg-gradient-to-r from-teal-700 to-slate-950 p-8 text-white"><h1 className="text-4xl font-black">My Events</h1><p className="mt-3 max-w-2xl text-slate-200">Create, edit and monitor all your events from one place.</p><div className="mt-6"><Link to="/organizer/events/create"><Button variant="light"><Plus className="mr-2 h-4 w-4"/>Create Event</Button></Link></div></section><div className="mb-6 grid gap-4 md:grid-cols-4">{loading?Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>):<><StatusCard label="Total events" value={stats.total} icon={CalendarCheck} gradient="from-teal-600 to-emerald-700"/><StatusCard label="Published" value={stats.published} icon={Radio} gradient="from-green-600 to-teal-700"/><StatusCard label="Pending" value={stats.pending} icon={Clock} gradient="from-amber-500 to-orange-700"/><StatusCard label="Drafts" value={stats.drafts} icon={FileText} gradient="from-slate-600 to-slate-800"/></>}</div>{error&&<div className="mb-6"><ErrorState title="Organizer events error" message={error}/></div>}{!loading&&events.length===0?<EmptyState title="No organizer events" message="Create your first event to start managing registrations and statistics."/>:<div className="grid gap-5">{events.map(event=><OrganizerEventCard key={event.id} event={event} onDelete={handleDelete}/>)}</div>}</PageContainer>
}
