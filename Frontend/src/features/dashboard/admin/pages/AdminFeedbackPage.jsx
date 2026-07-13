import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Eye, Search, Star } from 'lucide-react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Modal from '../../../../shared/components/ui/Modal.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import AdminHero from '../components/AdminHero.jsx'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import { adminService } from '../services/adminService.js'

function Stars({ rating }) {
  return <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Number(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [filters, setFilters] = useState({ keyword: '', category: 'all', rating: 'all' })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function buildParams() {
    const params = { per_page: 50 }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.category !== 'all') params.category = filters.category
    if (filters.rating !== 'all') params.rating = filters.rating
    return params
  }

  async function fetchFeedbacks() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getFeedbacks(buildParams())
      setFeedbacks(extractCollection(response.data, 'feedbacks'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load feedback.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedbacks() }, [])


  function updateFilter(event) { setFilters((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function resetFilters() { setFilters({ keyword: '', category: 'all', rating: 'all' }); setTimeout(fetchFeedbacks, 0) }

  const metrics = useMemo(() => ({
    total: feedbacks.length,
    high: feedbacks.filter((item) => Number(item.rating) >= 4).length,
  }), [feedbacks])

  const rows = feedbacks.map((feedback) => ({
    name: feedback.name || feedback.user?.name || 'Anonymous',
    email: feedback.email || feedback.user?.email || '—',
    rating: <Stars rating={feedback.rating} />,
    category: feedback.category,
    message: <span className="line-clamp-1 text-slate-600">{feedback.message || '—'}</span>,
    createdAt: formatDate(feedback.created_at),
    actions: <AdminPageActions><AdminActionButton onClick={() => setSelected(feedback)}><Eye className="mr-1 h-3 w-3" />Read</AdminActionButton></AdminPageActions>,
  }))

  return (
    <PageContainer>
      <AdminHero title="User feedback" description="Review ratings, suggestions and experience feedback from your community." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card><p className="text-sm text-slate-600">Total feedback</p><p className="mt-1 text-3xl font-black">{metrics.total}</p></Card>
        <Card><p className="text-sm text-slate-600">Positive ratings</p><p className="mt-1 text-3xl font-black">{metrics.high}</p></Card>
      </div>
      <Card className="my-6"><div className="grid gap-3 md:grid-cols-[1fr_170px_140px_auto_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Search feedback" className="pl-10"/></div><Select name="category" value={filters.category} onChange={updateFilter}><option value="all">All categories</option><option value="general">General</option><option value="bug">Bug</option><option value="feature">Feature</option><option value="design">Design/UI</option><option value="performance">Performance</option></Select><Select name="rating" value={filters.rating} onChange={updateFilter}><option value="all">All ratings</option>{[5,4,3,2,1].map(r=><option key={r} value={r}>{r} stars</option>)}</Select><Button onClick={fetchFeedbacks}>Search</Button><Button variant="secondary" onClick={resetFilters}>Reset</Button></div></Card>
      {loading && <Loader message="Loading feedback..." />}{error && <ErrorState title="Unable to load feedback" message={error}/>} {!loading&&!error&&<Table columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'rating',label:'Rating'},{key:'category',label:'Category'},{key:'message',label:'Message'},{key:'createdAt',label:'Date'},{key:'actions',label:'Actions'}]} rows={rows}/>} 
      <Modal open={Boolean(selected)} title="Feedback details" onClose={() => setSelected(null)}>{selected&&<div className="grid gap-4"><div className="rounded-3xl bg-gradient-to-br from-amber-500 to-pink-700 p-5 text-white"><p className="text-sm font-bold uppercase text-white/80">Feedback</p><h3 className="mt-1 text-2xl font-black">{selected.category}</h3><div className="mt-3"><Stars rating={selected.rating}/></div></div><div className="grid gap-2 text-sm text-slate-600"><p><strong>Name:</strong> {selected.name||selected.user?.name||'Anonymous'}</p><p><strong>Email:</strong> {selected.email||selected.user?.email||'—'}</p><p><strong>Date:</strong> {formatDate(selected.created_at)}</p></div><Card><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.message||'No message provided.'}</p></Card><div className="flex justify-end"><Button variant="secondary" onClick={() => setSelected(null)}>Close</Button></div></div>}</Modal>
    </PageContainer>
  )
}
