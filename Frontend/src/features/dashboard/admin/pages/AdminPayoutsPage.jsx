import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Banknote, CheckCircle2, Clock, Settings as SettingsIcon, XCircle } from 'lucide-react'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import EmptyState from '../../../../shared/components/feedback/EmptyState.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import { formatPrice } from '../../../../shared/utils/currency.js'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { adminPayoutService } from '../../../wallet/services/adminPayoutService.js'
import { useTranslation } from '../../../../shared/i18n/useTranslation.js'

const STATUS_STYLES = {
  requested: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
}

const FILTERS = ['all', 'requested', 'approved', 'paid', 'rejected']

export default function AdminPayoutsPage() {
  const { t } = useTranslation()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('requested')
  const [busy, setBusy] = useState(null)
  const [settings, setSettings] = useState(null)
  const [settingsForm, setSettingsForm] = useState({ platform_fee_percent: '', payout_grace_hours: '', min_payout_amount: '' })
  const [savingSettings, setSavingSettings] = useState(false)

  async function fetchPayouts() {
    setLoading(true)
    setError('')
    try {
      const params = filter === 'all' ? { per_page: 100 } : { status: filter, per_page: 100 }
      const res = await adminPayoutService.getPayouts(params)
      setPayouts(extractCollection(res.data, 'payouts'))
    } catch (e) {
      setError(getApiErrorMessage(e, t('payouts.loadError', 'Unable to load payouts.')))
    } finally {
      setLoading(false)
    }
  }

  async function fetchSettings() {
    try {
      const res = await adminPayoutService.getSettings()
      setSettings(res.data.settings)
      setSettingsForm({
        platform_fee_percent: res.data.settings.platform_fee_percent,
        payout_grace_hours: res.data.settings.payout_grace_hours,
        min_payout_amount: res.data.settings.min_payout_amount,
      })
    } catch { /* non-fatal */ }
  }

  useEffect(() => { fetchPayouts() }, [filter])
  useEffect(() => { fetchSettings() }, [])

  async function act(payout, action, payload) {
    setBusy(payout.id)
    try {
      if (action === 'approve') await adminPayoutService.approve(payout.id)
      if (action === 'reject') await adminPayoutService.reject(payout.id, payload || {})
      if (action === 'markPaid') await adminPayoutService.markPaid(payout.id, payload || {})
      toast.success(t(`payouts.${action}Done`, action === 'markPaid' ? 'Marked as paid.' : action === 'approve' ? 'Payout approved.' : 'Payout rejected.'))
      fetchPayouts()
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('payouts.actionFailed', 'Action failed.')))
    } finally {
      setBusy(null)
    }
  }

  async function saveSettings(event) {
    event.preventDefault()
    setSavingSettings(true)
    try {
      const res = await adminPayoutService.updateSettings(settingsForm)
      setSettings(res.data.settings)
      toast.success(t('payouts.settingsSaved', 'Settings saved.'))
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('payouts.settingsSaveFailed', 'Unable to save settings.')))
    } finally {
      setSavingSettings(false)
    }
  }

  const fmt = (v) => formatPrice(v)
  const sum = (status) => payouts.filter((p) => p.status === status).reduce((acc, p) => acc + Number(p.amount || 0), 0)

  const columns = [
    { key: 'organizer', label: t('payouts.organizer', 'Organizer') },
    { key: 'amount', label: t('payouts.amount', 'Amount') },
    { key: 'method', label: t('payouts.method', 'Method') },
    { key: 'status', label: t('payouts.status', 'Status') },
    { key: 'date', label: t('payouts.date', 'Date') },
    { key: 'actions', label: '' },
  ]

  const rows = payouts.map((p) => ({
    id: p.id,
    organizer: (
      <div className="min-w-0">
        <p className="font-bold text-slate-950">{p.organizer?.name || '—'}</p>
        <p className="truncate text-xs text-slate-500">{p.organizer?.email}</p>
      </div>
    ),
    amount: <span className="font-black text-slate-950">{fmt(p.amount)}</span>,
    method: p.method === 'bank' ? t('payouts.bank', 'Bank') : t('payouts.mobileMoney', 'Mobile Money'),
    status: <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status}</span>,
    date: <span className="text-xs text-slate-500">{formatDate(p.createdAt)}</span>,
    actions: (
      <div className="flex flex-wrap gap-1.5">
        {(p.status === 'requested') && <Button type="button" variant="secondary" className="!px-3 !py-1.5 text-xs" disabled={busy === p.id} onClick={() => act(p, 'approve')}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />{t('payouts.approve', 'Approve')}</Button>}
        {(p.status === 'requested' || p.status === 'approved') && <Button type="button" variant="outline" className="!px-3 !py-1.5 text-xs" disabled={busy === p.id} onClick={() => act(p, 'reject')}><XCircle className="mr-1 h-3.5 w-3.5" />{t('payouts.reject', 'Reject')}</Button>}
        {(p.status === 'approved' || p.status === 'requested') && <Button type="button" className="!px-3 !py-1.5 text-xs" disabled={busy === p.id} onClick={() => act(p, 'markPaid')}><Banknote className="mr-1 h-3.5 w-3.5" />{t('payouts.markPaid', 'Mark paid')}</Button>}
      </div>
    ),
  }))

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-teal-800 p-8 text-white">
        <Banknote className="h-10 w-10 text-teal-200" />
        <h1 className="mt-5 text-4xl font-black">{t('payouts.title', 'Payouts')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{t('payouts.subtitle', 'Review organizer withdrawal requests, approve them, and record manual payments.')}</p>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card><Clock className="h-6 w-6 text-amber-600" /><p className="mt-3 text-2xl font-black text-slate-950">{fmt(sum('requested'))}</p><p className="text-sm text-slate-500">{t('payouts.requested', 'Requested')}</p></Card>
        <Card><CheckCircle2 className="h-6 w-6 text-blue-600" /><p className="mt-3 text-2xl font-black text-slate-950">{fmt(sum('approved'))}</p><p className="text-sm text-slate-500">{t('payouts.approved', 'Approved')}</p></Card>
        <Card><Banknote className="h-6 w-6 text-green-600" /><p className="mt-3 text-2xl font-black text-slate-950">{fmt(sum('paid'))}</p><p className="text-sm text-slate-500">{t('payouts.paid', 'Paid out')}</p></Card>
        <Card><XCircle className="h-6 w-6 text-red-600" /><p className="mt-3 text-2xl font-black text-slate-950">{payouts.length}</p><p className="text-sm text-slate-500">{t('payouts.inView', 'In current view')}</p></Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === f ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'}`}>{t(`payouts.filter_${f}`, f)}</button>
        ))}
      </div>

      <Card className="mt-4">
        {loading ? <Loader message={t('payouts.loading', 'Loading payouts...')} /> : error ? <ErrorState title={t('payouts.errorTitle', 'Unable to load payouts')} message={error} /> : payouts.length === 0 ? <EmptyState title={t('payouts.empty', 'No payouts')} message={t('payouts.emptyMsg', 'There are no payout requests in this view.')} /> : <Table columns={columns} rows={rows} />}
      </Card>

      {settings && (
        <Card className="mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950"><SettingsIcon className="h-5 w-5 text-teal-700" /> {t('payouts.settingsTitle', 'Platform settings')}</h2>
          <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{t('payouts.feePercent', 'Platform fee (%)')}</span>
              <Input type="number" step="0.1" min="0" max="100" value={settingsForm.platform_fee_percent} onChange={(e) => setSettingsForm((c) => ({ ...c, platform_fee_percent: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{t('payouts.graceHours', 'Grace period (hours)')}</span>
              <Input type="number" min="0" value={settingsForm.payout_grace_hours} onChange={(e) => setSettingsForm((c) => ({ ...c, payout_grace_hours: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{t('payouts.minPayout', 'Minimum payout')}</span>
              <Input type="number" min="0" value={settingsForm.min_payout_amount} onChange={(e) => setSettingsForm((c) => ({ ...c, min_payout_amount: e.target.value }))} />
            </label>
            <div className="sm:col-span-3 flex justify-end"><Button type="submit" disabled={savingSettings}>{savingSettings ? t('common.saving', 'Saving...') : t('save', 'Save')}</Button></div>
          </form>
        </Card>
      )}
    </PageContainer>
  )
}
