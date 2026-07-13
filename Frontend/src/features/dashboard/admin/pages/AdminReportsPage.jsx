import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchReports() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getReports({ per_page: 50 })
      setReports(extractCollection(response.data, 'reports'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load reports.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  async function updateStatus(reportId, status) {
    await adminService.updateReportStatus(reportId, status)
    await fetchReports()
  }

  const rows = reports.map((report) => ({
    type: report.type,
    target: report.event?.title || '—',
    reportedBy: report.reporter?.email || '—',
    createdAt: formatDate(report.created_at),
    status: <AdminStatusBadge status={report.status} />,
    actions: (
      <AdminPageActions>
        <AdminActionButton onClick={() => updateStatus(report.id, 'reviewing')}>Review</AdminActionButton>
        <AdminActionButton onClick={() => updateStatus(report.id, 'resolved')}>Resolve</AdminActionButton>
        <AdminActionButton onClick={() => updateStatus(report.id, 'rejected')}>Reject</AdminActionButton>
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <SectionHeader title="Reports" description="Review reports and platform issues submitted by users." />
      {loading && <Loader message="Loading reports..." />}
      {error && <ErrorState title="Unable to load reports" message={error} />}
      {!loading && !error && <Table columns={[{ key: 'type', label: 'Type' }, { key: 'target', label: 'Target' }, { key: 'reportedBy', label: 'Reported By' }, { key: 'createdAt', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={rows} />}
    </PageContainer>
  )
}
