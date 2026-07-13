import { CalendarCheck, Clock, FileText, Plus, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import ConfirmDialog from '../../../shared/components/feedback/ConfirmDialog.jsx'
import StatCardSkeleton from '../../../shared/components/feedback/StatCardSkeleton.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import OrganizerEventCard from '../components/OrganizerEventCard.jsx'
import { eventService } from '../services/eventService.js'
import { extractCollection, normalizeEvents } from '../utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function StatusCard({ label, value, icon: Icon, gradient }) { return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15"/><Icon className="relative h-6 w-6"/><p className="relative mt-3 text-3xl font-black">{value}</p><p className="relative text-sm text-white/85">{label}</p></div> }

export default function MyEventsPage() {
  const { t } = useTranslation()
  const [events,setEvents]=useState([]); const[loading,setLoading]=useState(true); const[error,setError]=useState(''); const[deleteTarget,setDeleteTarget]=useState(null); const[deleting,setDeleting]=useState(false); const[duplicating,setDuplicating]=useState(false)
  async function fetchEvents(){setLoading(true);setError('');try{const r=await eventService.getOrganizerEvents({per_page:50});setEvents(normalizeEvents(extractCollection(r.data,'events')))}catch(e){setError(getApiErrorMessage(e,'Unable to load organizer events.'))}finally{setLoading(false)}}
  useEffect(()=>{fetchEvents()},[])
  const stats=useMemo(()=>({total:events.length,published:events.filter(e=>e.status==='published').length,pending:events.filter(e=>e.status==='pending').length,drafts:events.filter(e=>e.status==='draft').length}),[events])
  async function handleDelete(){
    if(!deleteTarget) return
    setDeleting(true)
    try{await eventService.deleteEvent(deleteTarget.id); setDeleteTarget(null); await fetchEvents()}catch(e){setError(getApiErrorMessage(e,'Unable to delete event.'))}finally{setDeleting(false)}
  }

  async function handleDuplicate(eventId){
    setDuplicating(true)
    try{await eventService.duplicateEvent(eventId); toast.success(t('events.dashboard.duplicateSuccess')); await fetchEvents()}catch(e){const m=getApiErrorMessage(e,t('events.dashboard.duplicateError')); toast.error(m); setError(m)}finally{setDuplicating(false)}
  }

  return <PageContainer><section className="mb-6 rounded-3xl bg-gradient-to-r from-teal-700 to-slate-950 p-8 text-white"><h1 className="text-4xl font-black">{t('events.dashboard.title')}</h1><p className="mt-3 max-w-2xl text-slate-200">{t('events.dashboard.description')}</p><div className="mt-6"><Link to="/organizer/events/create"><Button variant="light"><Plus className="mr-2 h-4 w-4"/>{t('events.dashboard.createEventButton')}</Button></Link></div></section><div className="mb-6 grid gap-4 md:grid-cols-4">{loading?Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>):<><StatusCard label={t('events.dashboard.stats.total')} value={stats.total} icon={CalendarCheck} gradient="from-teal-600 to-emerald-700"/><StatusCard label={t('events.dashboard.stats.published')} value={stats.published} icon={Radio} gradient="from-green-600 to-teal-700"/><StatusCard label={t('events.dashboard.stats.pending')} value={stats.pending} icon={Clock} gradient="from-amber-500 to-orange-700"/><StatusCard label={t('events.dashboard.stats.drafts')} value={stats.drafts} icon={FileText} gradient="from-slate-600 to-slate-800"/></>}</div>{error&&<div className="mb-6"><ErrorState title={t('events.dashboard.errorTitle')} message={error}/></div>}{!loading&&events.length===0?<EmptyState title={t('events.dashboard.emptyTitle')} message={t('events.dashboard.emptyMessage')}/>:<div className="grid gap-5">{events.map(event=><OrganizerEventCard key={event.id} event={event} onDelete={(eventId)=>setDeleteTarget(events.find((event)=>event.id===eventId))} onDuplicate={handleDuplicate}/>)}</div>}<ConfirmDialog open={Boolean(deleteTarget)} title={t('events.dashboard.deleteTitle')} message={t('events.dashboard.deleteMessage', { title: deleteTarget?.title })} confirmLabel={t('events.dashboard.deleteConfirm')} loading={deleting} onConfirm={handleDelete} onClose={()=>setDeleteTarget(null)} /></PageContainer>
}
