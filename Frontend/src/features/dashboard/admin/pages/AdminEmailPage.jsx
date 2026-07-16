import { Mail, Send, Search } from 'lucide-react'
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
  return {
    id: log.id,
    recipient: log.recipient,
    subject: log.subject || '—',
    type: log.type || '—',
    status: log.status,
    error: log.error_message || '—',
    sentAt: log.sent_at ? formatDate(log.sent_at) : '—',
    createdAt: formatDate(log.created_at),
  }
}

export default function AdminEmailPage() {
  const [form, setForm] = useState({ recipient: '', subject: 'Email delivery test', message: 'This confirms that production email delivery is working.' })
  const [logs, setLogs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchLogs() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getEmailLogs({ per_page: 50 })
      setLogs(extractCollection(response.data, 'email_logs').map(normalizeEmailLog))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load email logs.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const visibleLogs = useMemo(() => {
    const value = keyword.trim().toLowerCase()
    if (!value) return logs
    return logs.filter((log) => [log.recipient, log.subject, log.type, log.status, log.error].some((field) => String(field || '').toLowerCase().includes(value)))
  }, [logs, keyword])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function sendTestEmail(event) {
    event.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const response = await adminService.sendTestEmail(form)
      const message = response.data.message || 'Test email sent successfully.'
      setSuccess(message)
      toast.success(message)
      await fetchLogs()
    } catch (sendError) {
      const message = getApiErrorMessage(sendError, 'Unable to send test email.')
      setError(message)
      toast.error(message)
      await fetchLogs()
    } finally {
      setSending(false)
    }
  }

  return (
    <PageContainer>
      <SectionHeader title="Email Delivery" description="Send production Brevo test emails and review email delivery failures." />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <div className="mb-5 rounded-3xl bg-gradient-to-br from-teal-700 to-slate-950 p-5 text-white">
            <Mail className="h-8 w-8 text-teal-100" />
            <h2 className="mt-3 text-2xl font-black">Send test email</h2>
          </div>

          {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

          <form onSubmit={sendTestEmail} className="grid gap-4">
            <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Recipient email</span><Input name="recipient" type="email" value={form.recipient} onChange={updateField} placeholder="admin@example.com" required /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Subject</span><Input name="subject" value={form.subject} onChange={updateField} required /></label>
            <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Message</span><Textarea name="message" value={form.message} onChange={updateField} rows="4" required /></label>
            <Button type="submit" disabled={sending}><Send className="mr-2 h-4 w-4" />{sending ? 'Sending...' : 'Send test email'}</Button>
          </form>
        </Card>

        <div>
          <Card className="mb-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Email logs</h2>
                <p className="text-sm text-slate-600">Review test email results and mail notification failures.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search logs" className="pl-9" />
              </div>
            </div>
          </Card>

          {loading && <Loader message="Loading email logs..." />}
          {!loading && error && logs.length === 0 && <ErrorState title="Unable to load email logs" message={error} />}
          {!loading && (
            <Table
              columns={[
                { key: 'recipient', label: 'Recipient' },
                { key: 'subject', label: 'Subject' },
                { key: 'type', label: 'Type' },
                { key: 'status', label: 'Status' },
                { key: 'error', label: 'Error' },
                { key: 'createdAt', label: 'Date' },
              ]}
              rows={visibleLogs.map((log) => ({
                ...log,
                status: <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${log.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{log.status}</span>,
              }))}
            />
          )}
        </div>
      </div>
    </PageContainer>
  )
}
