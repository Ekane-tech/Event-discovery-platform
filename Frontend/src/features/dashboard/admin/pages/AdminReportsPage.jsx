import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, FileSearch, Search, ShieldCheck } from 'lucide-react'
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
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

function ReportMetric({ label, value, icon: Icon, gradient }) {
  return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15"/><Icon className="relative h-6 w-6"/><p className="relative mt-3 text-3xl font-black">{value}</p><p className="relative text-sm text-white/85">{label}</p></div>
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: 'all', type: 'all' })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function buildParams() {
    const params = { per_page: 50 }
    if (filters.status !== 'all') params.status = filters.status
    if (filters.type !== 'all') params.type = filters.type
    return params
  }

  async function fetchReports() {
    setLoading(true); setError('')
    try { const response = await adminService.getReports(buildParams()); setReports(extractCollection(response.data, 'reports')) }
    catch (fetchError) { setError(getApiErrorMessage(fetchError, 'Unable to load reports.')) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReports() }, [])

  const filteredReports = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    if (!keyword) return reports
    return reports.filter((report) => report.type?.toLowerCase().includes(keyword) || report.message?.toLowerCase().includes(keyword) || report.event?.title?.toLowerCase().includes(keyword) || report.reporter?.email?.toLowerCase().includes(keyword))
  }, [reports, filters.keyword])

  const metrics = useMemo(() => ({ total: reports.length, open: reports.filter((r) => r.status === 'open').length, reviewing: reports.filter((r) => r.status === 'reviewing').length, resolved: reports.filter((r) => r.status === 'resolved').length }), [reports])

  async function updateStatus(reportId, status) {
    try { await adminService.updateReportStatus(reportId, status); toast.success('Report status updated.'); await fetchReports(); if (selected?.id === reportId) setSelected({ ...selected, status }) }
    catch (statusError) { toast.error(getApiErrorMessage(statusError, 'Unable to update report.')) }
  }

  function updateFilter(event) { setFilters((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function resetFilters() { setFilters({ keyword: '', status: 'all', type: 'all' }); setTimeout(fetchReports, 0) }

  const rows = filteredReports.map((report) => ({
    type: <span className="font-semibold text-slate-800">{report.type}</span>,
    target: report.event?.title || '—',
    reportedBy: report.reporter?.email || '—',
    createdAt: formatDate(report.created_at),
    status: <AdminStatusBadge status={report.status} />,
    actions: <AdminPageActions><AdminActionButton onClick={() => setSelected(report)}><Eye className="mr-1 h-3 w-3" />Details</AdminActionButton>{report.status !== 'reviewing' && <AdminActionButton onClick={() => updateStatus(report.id, 'reviewing')}>Review</AdminActionButton>}{report.status !== 'resolved' && <AdminActionButton onClick={() => updateStatus(report.id, 'resolved')}>Resolve</AdminActionButton>}{report.status !== 'rejected' && <AdminActionButton onClick={() => updateStatus(report.id, 'rejected')}>Reject</AdminActionButton>}</AdminPageActions>,
  }))

  return <PageContainer><AdminHero title="Reports" description="Review user reports and resolve trust or quality issues." />
    <div className="mt-6 grid gap-4 md:grid-cols-4"><ReportMetric label="Total reports" value={metrics.total} icon={FileSearch} gradient="from-indigo-600 to-blue-700"/><ReportMetric label="Open" value={metrics.open} icon={AlertTriangle} gradient="from-rose-600 to-pink-700"/><ReportMetric label="Reviewing" value={metrics.reviewing} icon={Eye} gradient="from-amber-500 to-orange-700"/><ReportMetric label="Resolved" value={metrics.resolved} icon={ShieldCheck} gradient="from-teal-600 to-emerald-700"/></div>
    <Card className="my-6"><div className="grid gap-3 md:grid-cols-[1fr_180px_190px_auto_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Search reports" className="pl-10"/></div><Select name="status" value={filters.status} onChange={updateFilter}><option value="all">All statuses</option><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option></Select><Select name="type" value={filters.type} onChange={updateFilter}><option value="all">All types</option><option value="fake_event">Fake event</option><option value="wrong_information">Wrong information</option><option value="wrong_location">Wrong location</option><option value="inappropriate_content">Inappropriate content</option><option value="duplicate_event">Duplicate event</option><option value="scam_or_fraud">Scam or fraud</option><option value="other">Other</option></Select><Button onClick={fetchReports}>Search</Button><Button variant="secondary" onClick={resetFilters}>Reset</Button></div></Card>
    {loading && <Loader message="Loading reports..."/>}{error && <ErrorState title="Unable to load reports" message={error}/>} {!loading && !error && <Table columns={[{key:'type',label:'Type'},{key:'target',label:'Target'},{key:'reportedBy',label:'Reported By'},{key:'createdAt',label:'Date'},{key:'status',label:'Status'},{key:'actions',label:'Actions'}]} rows={rows}/>} 
    <Modal open={Boolean(selected)} title="Report details" onClose={() => setSelected(null)}>{selected && <div className="grid gap-4"><div className="rounded-3xl bg-gradient-to-br from-rose-600 to-amber-600 p-5 text-white"><p className="text-sm font-bold uppercase text-white/80">Report</p><h3 className="mt-1 text-2xl font-black">{selected.type}</h3><p className="mt-2 text-sm text-white/90">Status: {selected.status}</p></div><div className="grid gap-2 text-sm text-slate-600"><p><strong>Event:</strong> {selected.event?.title || '—'}</p><p><strong>Reporter:</strong> {selected.reporter?.email || '—'}</p><p><strong>Date:</strong> {formatDate(selected.created_at)}</p></div><Card><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.message || 'No message provided.'}</p></Card><div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>{selected.status !== 'reviewing' && <Button variant="secondary" onClick={() => updateStatus(selected.id, 'reviewing')}>Mark reviewing</Button>}{selected.status !== 'resolved' && <Button onClick={() => updateStatus(selected.id, 'resolved')}>Resolve</Button>}{selected.status !== 'rejected' && <Button variant="danger" onClick={() => updateStatus(selected.id, 'rejected')}>Reject</Button>}</div></div>}</Modal>
  </PageContainer>
}
