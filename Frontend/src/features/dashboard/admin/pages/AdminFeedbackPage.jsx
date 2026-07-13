import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: 'all', category: 'all', rating: 'all' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function buildParams() {
    const params = { per_page: 50 }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.status !== 'all') params.status = filters.status
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

  async function markRead(feedbackId) {
    try {
      await adminService.updateFeedbackStatus(feedbackId, 'read')
      toast.success('Feedback marked as read.')
      await fetchFeedbacks()
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, 'Unable to update feedback.'))
    }
  }

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function resetFilters() {
    setFilters({ keyword: '', status: 'all', category: 'all', rating: 'all' })
    setTimeout(fetchFeedbacks, 0)
  }

  const rows = feedbacks.map((feedback) => ({
    name: feedback.name || feedback.user?.name || 'Anonymous',
    email: feedback.email || feedback.user?.email || '—',
    rating: `${feedback.rating}/5`,
    category: feedback.category,
    message: feedback.message || '—',
    status: <AdminStatusBadge status={feedback.status} />,
    createdAt: formatDate(feedback.created_at),
    actions: (
      <AdminPageActions>
        {feedback.status !== 'read' && <AdminActionButton onClick={() => markRead(feedback.id)}>Read</AdminActionButton>}
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <SectionHeader title="User Feedback" description="Review ratings, suggestions, bug reports, and user experience feedback." />

      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-5">
          <Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Search feedback" />
          <Select name="status" value={filters.status} onChange={updateFilter}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </Select>
          <Select name="category" value={filters.category} onChange={updateFilter}>
            <option value="all">All categories</option>
            <option value="general">General</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="design">Design/UI</option>
            <option value="performance">Performance</option>
          </Select>
          <Select name="rating" value={filters.rating} onChange={updateFilter}>
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
          </Select>
          <div className="flex gap-2"><Button type="button" onClick={fetchFeedbacks}>Search</Button><Button type="button" variant="secondary" onClick={resetFilters}>Reset</Button></div>
        </div>
      </Card>

      {loading && <Loader message="Loading feedback..." />}
      {error && <ErrorState title="Unable to load feedback" message={error} />}
      {!loading && !error && (
        <Table
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'rating', label: 'Rating' },
            { key: 'category', label: 'Category' },
            { key: 'message', label: 'Message' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Date' },
            { key: 'actions', label: 'Actions' },
          ]}
          rows={rows}
        />
      )}
    </PageContainer>
  )
}