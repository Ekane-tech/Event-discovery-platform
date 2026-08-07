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
import { useTranslation } from '../../../../shared/i18n/useTranslation.js'
import AdminHero from '../components/AdminHero.jsx'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import { adminService } from '../services/adminService.js'

function Stars({ rating, t }) {
  return <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => 
      <Star key={i} className={`h-4 w-4 ${i < Number(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
    )}
  </div>
}

export default function AdminFeedbackPage() {
  const { t } = useTranslation()
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
      setError(getApiErrorMessage(fetchError, t('admin.feedback.toasts.error.load', 'Unable to load feedback.')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedbacks() }, [])

  function updateFilter(event) { 
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value })) 
  }
  function resetFilters() { 
    setFilters({ keyword: '', category: 'all', rating: 'all' }) 
    setTimeout(fetchFeedbacks, 0) 
  }

  const metrics = useMemo(() => ({
    total: feedbacks.length,
    high: feedbacks.filter((item) => Number(item.rating) >= 4).length,
  }), [feedbacks])

  const rows = feedbacks.map((feedback) => ({
    name: feedback.name || feedback.user?.name || t('admin.common.anonymous', 'Anonymous'),
    email: feedback.email || feedback.user?.email || '—',
    rating: <Stars rating={feedback.rating} t={t} />,
    category: t(`admin.feedback.categoryFilter.${feedback.category}`, feedback.category),
    message: <span className="line-clamp-1 text-slate-600">{feedback.message || '—'}</span>,
    createdAt: formatDate(feedback.created_at),
    actions: (
      <AdminPageActions>
        <AdminActionButton onClick={() => setSelected(feedback)}>
          <Eye className="mr-1 h-3 w-3" />{t('admin.feedback.actions.read', 'Read')}
        </AdminActionButton>
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <AdminHero 
        title={t('admin.feedback.title', 'User feedback')} 
        description={t('admin.feedback.description', 'Review ratings, suggestions and experience feedback from your community.')} 
      />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-slate-600">{t('admin.feedback.totalFeedback', 'Total feedback')}</p>
          <p className="mt-1 text-2xl font-black md:text-3xl">{metrics.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-600">{t('admin.feedback.positiveRatings', 'Positive ratings')}</p>
          <p className="mt-1 text-2xl font-black md:text-3xl">{metrics.high}</p>
        </Card>
      </div>
      <Card className="my-6">
        <div className="grid gap-3 md:grid-cols-[1fr_170px_140px_auto_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
            <Input 
              name="keyword" 
              value={filters.keyword} 
              onChange={updateFilter} 
              placeholder={t('admin.feedback.searchPlaceholder', 'Search feedback')} 
              className="pl-10"
            />
          </div>
          <Select name="category" value={filters.category} onChange={updateFilter}>
            <option value="all">{t('admin.feedback.categoryFilter.all', 'All categories')}</option>
            <option value="general">{t('admin.feedback.categoryFilter.general', 'General')}</option>
            <option value="bug">{t('admin.feedback.categoryFilter.bug', 'Bug')}</option>
            <option value="feature">{t('admin.feedback.categoryFilter.feature', 'Feature')}</option>
            <option value="design">{t('admin.feedback.categoryFilter.design', 'Design/UI')}</option>
            <option value="performance">{t('admin.feedback.categoryFilter.performance', 'Performance')}</option>
          </Select>
          <Select name="rating" value={filters.rating} onChange={updateFilter}>
            <option value="all">{t('admin.feedback.ratingFilter.all', 'All ratings')}</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{t('admin.feedback.ratingFilter.stars', { count: r }, '{{count}} stars')}</option>)}
          </Select>
          <Button onClick={fetchFeedbacks}>{t('admin.common.search', 'Search')}</Button>
          <Button variant="secondary" onClick={resetFilters}>{t('admin.common.reset', 'Reset')}</Button>
        </div>
      </Card>
      {loading && <Loader message={t('admin.common.loading', { type: t('admin.feedback.title', 'feedback') }, 'Loading feedback...')} />}
      {error && <ErrorState title={t('admin.common.errorTitle', 'Error')} message={error}/>}
      {!loading && !error && <Table 
        columns={[
          { key: 'name', label: t('admin.feedback.table.name', 'Name') },
          { key: 'email', label: t('admin.feedback.table.email', 'Email') },
          { key: 'rating', label: t('admin.feedback.table.rating', 'Rating') },
          { key: 'category', label: t('admin.feedback.table.category', 'Category') },
          { key: 'message', label: t('admin.feedback.table.message', 'Message') },
          { key: 'createdAt', label: t('admin.feedback.table.date', 'Date') },
          { key: 'actions', label: t('admin.common.actions', 'Actions') }
        ]} 
        rows={rows} 
      />}
      
      <Modal open={Boolean(selected)} title={t('admin.feedback.modal.title', 'Feedback details')} onClose={() => setSelected(null)}>
        {selected && <div className="grid gap-4">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{t('admin.feedback.modal.categoryLabel', 'Feedback')}</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">{t(`admin.feedback.categoryFilter.${selected.category}`, selected.category)}</h3>
            <div className="mt-3"><Stars rating={selected.rating} t={t} /></div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600">
            <p><strong>{t('admin.feedback.modal.nameLabel', 'Name:')}</strong> {selected.name || selected.user?.name || t('admin.common.anonymous', 'Anonymous')}</p>
            <p><strong>{t('admin.feedback.modal.emailLabel', 'Email:')}</strong> {selected.email || selected.user?.email || '—'}</p>
            <p><strong>{t('admin.feedback.modal.dateLabel', 'Date:')}</strong> {formatDate(selected.created_at)}</p>
          </div>
          <Card>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {selected.message || t('admin.reports.modal.noMessage', 'No message provided.')}
            </p>
          </Card>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setSelected(null)}>{t('admin.common.close', 'Close')}</Button>
          </div>
        </div>}
      </Modal>
    </PageContainer>
  )
}
