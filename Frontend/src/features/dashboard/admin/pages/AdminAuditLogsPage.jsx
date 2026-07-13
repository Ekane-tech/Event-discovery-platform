import { History, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { adminService } from '../services/adminService.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function normalizeLog(log) {
  return {
    id: log.id,
    actor: log.actor?.name || 'System',
    email: log.actor?.email || '—',
    action: log.action,
    target: log.auditable_type ? `${log.auditable_type} #${log.auditable_id}` : '—',
    description: log.description || '—',
    ip: log.ip_address || '—',
    createdAt: formatDate(log.created_at),
  }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      try {
        const response = await adminService.getAuditLogs({ per_page: 100 })
        setLogs(extractCollection(response.data, 'audit_logs').map(normalizeLog))
      } catch (fetchError) {
        setError(getApiErrorMessage(fetchError, 'Unable to load audit logs.'))
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const visibleLogs = useMemo(() => {
    const value = keyword.trim().toLowerCase()
    if (!value) return logs
    return logs.filter((log) => [log.actor, log.email, log.action, log.target, log.description].some((field) => String(field || '').toLowerCase().includes(value)))
  }, [logs, keyword])

  if (loading) return <PageContainer><Loader message="Loading audit logs..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Audit log error" message={error} /></PageContainer>

  return (
    <PageContainer>
      <SectionHeader title="Audit Logs" description="Review important administrative and organizer actions across the platform." />
      <Card className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Activity trail</h2>
            <p className="text-sm text-slate-600">Search action names, actors, descriptions and targets.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="rounded-2xl border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search audit logs" />
          </div>
        </div>
      </Card>
      <Table
        columns={[
          { key: 'action', label: 'Action' },
          { key: 'actor', label: 'Actor' },
          { key: 'target', label: 'Target' },
          { key: 'description', label: 'Description' },
          { key: 'ip', label: 'IP' },
          { key: 'createdAt', label: 'Date' },
        ]}
        rows={visibleLogs.map((log) => ({
          ...log,
          action: <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"><History className="h-3.5 w-3.5 text-teal-700" />{log.action}</span>,
        }))}
      />
    </PageContainer>
  )
}
