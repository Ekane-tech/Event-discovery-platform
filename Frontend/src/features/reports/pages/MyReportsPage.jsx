import { AlertTriangle, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'
import { reportService } from '../services/reportService.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function MyReportsPage() {
  const { t } = useTranslation()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function run() {
      try {
        const r = await reportService.getReports({ per_page: 50 })
        setReports(extractCollection(r.data, 'reports'))
      } catch (e) {
        setError(getApiErrorMessage(e, t('report.loadError', 'Unable to load your reports.')))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-amber-600 to-red-700 p-8 text-white">
        <AlertTriangle className="h-10 w-10 text-amber-100" />
        <h1 className="mt-5 text-4xl font-black">{t('report.title', 'My reports')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{t('report.subtitle', 'Track event reports you submitted to the moderation team.')}</p>
        <div className="mt-6"><Link to="/events"><Button className="bg-white text-slate-950 hover:bg-slate-100">{t('browseEvents', 'Browse Events')}</Button></Link></div>
      </section>
      <div className="mt-6">
        {loading && <Loader message={t('report.loading', 'Loading your reports...')} />}
        {error && <ErrorState title={t('report.errorTitle', 'Unable to load reports')} message={error} />}
        {!loading && !error && reports.length === 0 && <EmptyState title={t('report.emptyTitle', 'No reports submitted')} message={t('report.emptyMessage', 'If you find a suspicious event, open its details and click Report Event.')} />}
        {!loading && !error && reports.length > 0 && (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><FileText className="h-5 w-5" /></span>
                      <div>
                        <h2 className="font-black text-slate-950">{report.event?.title || t('report.eventReportFallback', 'Event report')}</h2>
                        <p className="text-sm text-slate-500">{t('report.submitted', 'Submitted')} {formatDate(report.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-1 text-sm text-slate-600">
                      <p><strong>{t('report.typeLabel', 'Type:')}</strong> {report.type}</p>
                      <p><strong>{t('report.statusLabel', 'Status:')}</strong> {report.status}</p>
                      {report.message && <p>{report.message}</p>}
                    </div>
                  </div>
                  {report.event?.id && <Link to={`/events/${report.event.id}`}><Button variant="secondary">{t('report.viewEvent', 'View Event')}</Button></Link>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
