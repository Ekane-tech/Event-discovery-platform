import { BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import axiosClient from '../../../shared/api/axiosClient.js'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'

export default function PublicNotificationsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { async function fetchAnnouncements(){ try{ const r=await axiosClient.get('/public/notifications'); const v=r.data.announcements; setAnnouncements(Array.isArray(v)?v:v?.data||[]) }catch{ setError('Unable to load public announcements.') }finally{ setLoading(false) } } fetchAnnouncements() }, [])

  return (
    <div>
      <section className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100"><BellRing className="mr-2 h-4 w-4" /> Public updates</span><h1 className="mt-5 text-4xl font-black md:text-6xl">Platform announcements</h1><p className="mt-4 max-w-2xl text-slate-300">Stay informed about important updates, maintenance notices, and platform-wide news.</p></div></section>
      <PageContainer>
        <SectionHeader title="Latest announcements" description="Important information available to everyone." />
        {loading && <Loader message="Loading announcements..." />}
        {error && <ErrorState title="Unable to load announcements" message={error} />}
        {!loading && !error && announcements.length === 0 && <EmptyState title="No public announcements" message="There are no public announcements at the moment." />}
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((item) => <Card key={item.id} className="border-l-4 border-l-teal-600"><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Announcement</p><h2 className="mt-2 text-xl font-bold text-slate-950">{item.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-4 text-xs text-slate-500">{item.sent_at ? formatDate(item.sent_at) : formatDate(item.created_at)}</p></Card>)}
        </div>
      </PageContainer>
    </div>
  )
}
