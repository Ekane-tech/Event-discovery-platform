import { Mail, RefreshCw, Search, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Textarea from '../../../../shared/components/ui/Textarea.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { adminService } from '../services/adminService.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function normalizeEmailLog(log) {
  return { id: log.id, recipient: log.recipient, subject: log.subject || '—', type: log.type || '—', status: log.status, error: log.error_message || '—', sentAt: log.sent_at ? formatDate(log.sent_at) : '—', createdAt: formatDate(log.created_at) }
}
function StatusPill({ status }) { const failed = status === 'failed'; return <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${failed ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{status}</span> }

export default function AdminEmailPage() {
  const [form, setForm] = useState({ recipient: '', subject: 'Email delivery test', message: 'This confirms that production email delivery is working.' })
  const [logs, setLogs] = useState([]); const [keyword, setKeyword] = useState(''); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  async function fetchLogs({ silent = false } = {}) { if (silent) setRefreshing(true); else setLoading(true); setError(''); try { const response = await adminService.getEmailLogs({ per_page: 50 }); setLogs(extractCollection(response.data, 'email_logs').map(normalizeEmailLog)) } catch (fetchError) { setError(getApiErrorMessage(fetchError, 'Unable to load email logs.')) } finally { setLoading(false); setRefreshing(false) } }
  useEffect(() => { fetchLogs() }, [])
  const visibleLogs = useMemo(() => { const value = keyword.trim().toLowerCase(); if (!value) return logs; return logs.filter((log) => [log.recipient, log.subject, log.type, log.status, log.error].some((field) => String(field || '').toLowerCase().includes(value))) }, [logs, keyword])
  const stats = useMemo(() => ({ total: logs.length, sent: logs.filter((log) => log.status !== 'failed').length, failed: logs.filter((log) => log.status === 'failed').length }), [logs])
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function sendTestEmail(event) { event.preventDefault(); setSending(true); setError(''); setSuccess(''); try { const response = await adminService.sendTestEmail(form); const message = response.data.message || 'Test email sent successfully.'; setSuccess(message); toast.success(message); await fetchLogs({ silent: true }) } catch (sendError) { const message = getApiErrorMessage(sendError, 'Unable to send test email.'); setError(message); toast.error(message); await fetchLogs({ silent: true }) } finally { setSending(false) } }
  return (
    <PageContainer>
      <SectionHeader title="Email Delivery" description="Test production email delivery and monitor outgoing mail results." />
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">{[['Total logs', stats.total, 'from-slate-700 to-slate-950'], ['Sent', stats.sent, 'from-teal-600 to-emerald-700'], ['Failed', stats.failed, 'from-rose-600 to-pink-700']].map(([label, value, gradient]) => <div key={label} className={`rounded-3xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm sm:p-5`}><p className="text-xs font-semibold text-white/75 sm:text-sm">{label}</p><p className="mt-2 text-2xl font-black sm:text-3xl">{value}</p></div>)}</div>
      <div className="grid gap-6 2xl:grid-cols-[520px_1fr]">
        <Card className="overflow-hidden p-0"><div className="bg-gradient-to-br from-teal-700 to-slate-950 p-6 text-white"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Mail className="h-7 w-7 text-teal-100" /></span><div><h2 className="text-2xl font-black">Send test email</h2><p className="mt-1 text-sm text-slate-200">Use this to verify Brevo delivery after deployment changes.</p></div></div></div><div className="p-5">{success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}{error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}<form onSubmit={sendTestEmail} className="grid gap-4"><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Recipient email</span><Input name="recipient" type="email" value={form.recipient} onChange={updateField} placeholder="admin@example.com" required /></label><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Subject</span><Input name="subject" value={form.subject} onChange={updateField} required /></label><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Message</span><Textarea name="message" value={form.message} onChange={updateField} rows="5" required /></label><Button type="submit" disabled={sending} className="h-12"><Send className="mr-2 h-4 w-4" />{sending ? 'Sending...' : 'Send test email'}</Button></form></div></Card>
        <div className="min-w-0"><Card className="mb-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-black text-slate-950"><ShieldCheck className="h-5 w-5 text-teal-700" /> Email logs</h2><p className="text-sm text-slate-600">Search delivery attempts, failures and recipient addresses.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative min-w-0 sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search logs" className="pl-9" /></div><Button type="button" variant="secondary" onClick={() => fetchLogs({ silent: true })} disabled={refreshing}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div></div></Card>{loading && <Loader message="Loading email logs..." />}{!loading && error && logs.length === 0 && <ErrorState title="Unable to load email logs" message={error} />}{!loading && <><div className="grid gap-3 lg:hidden">{visibleLogs.map((log) => <Card key={log.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold text-slate-950">{log.recipient}</p><p className="mt-1 text-sm text-slate-600">{log.subject}</p></div><StatusPill status={log.status} /></div><div className="mt-3 grid gap-2 text-xs text-slate-500"><p><strong>Type:</strong> {log.type}</p><p><strong>Date:</strong> {log.createdAt}</p>{log.error !== '—' && <p className="text-red-600"><strong>Error:</strong> {log.error}</p>}</div></Card>)}</div><div className="hidden lg:block"><Table columns={[{ key: 'recipient', label: 'Recipient' }, { key: 'subject', label: 'Subject' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'error', label: 'Error' }, { key: 'createdAt', label: 'Date' }]} rows={visibleLogs.map((log) => ({ ...log, status: <StatusPill status={log.status} /> }))} /></div></>}</div>
      </div>
    </PageContainer>
  )
}
