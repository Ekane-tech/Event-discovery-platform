import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Banknote, Clock, PiggyBank, TrendingUp, Wallet as WalletIcon, X } from 'lucide-react'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import EmptyState from '../../../shared/components/feedback/EmptyState.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatPrice } from '../../../shared/utils/currency.js'
import { formatDate } from '../../../shared/utils/formatDate.js'
import { extractCollection } from '../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { walletService } from '../services/walletService.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

const PAYOUT_STATUSES = {
  requested: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
}

const CREDIT_STATUSES = {
  held: 'bg-amber-50 text-amber-700',
  released: 'bg-green-50 text-green-700',
  reversed: 'bg-red-50 text-red-700',
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Icon className="h-5 w-5" /></span>
      <p className="relative mt-4 text-2xl font-black md:text-3xl">{value}</p>
      <p className="relative text-sm text-white/85">{label}</p>
    </div>
  )
}

export default function OrganizerWalletPage() {
  const { t } = useTranslation()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'mobile_money', operator: 'mtn', number: '', bankName: '', accountName: '', accountNumber: '' })

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      const [walletRes, txRes, payoutRes] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions({ per_page: 20 }),
        walletService.getPayouts({ per_page: 20 }),
      ])
      setWallet(walletRes.data.wallet)
      setTransactions(extractCollection(txRes.data, 'transactions'))
      setPayouts(extractCollection(payoutRes.data, 'payouts'))
    } catch (e) {
      setError(getApiErrorMessage(e, t('wallet.loadError', 'Unable to load your wallet.')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  function openModal() {
    setForm({ amount: '', method: wallet?.payout_method || 'mobile_money', operator: wallet?.payout_details?.operator || 'mtn', number: wallet?.payout_details?.number || '', bankName: wallet?.payout_details?.bank_name || '', accountName: wallet?.payout_details?.account_name || '', accountNumber: wallet?.payout_details?.account_number || '' })
    setModalOpen(true)
  }

  async function submitPayout(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return toast.error(t('wallet.invalidAmount', 'Enter a valid amount.'))
    if (wallet?.rules && amount < wallet.rules.min_payout) return toast.error(t('wallet.belowMin', 'Amount is below the minimum payout.'))
    if (wallet && amount > wallet.available) return toast.error(t('wallet.exceedsAvailable', 'Amount exceeds your available balance.'))

    const destination = form.method === 'mobile_money'
      ? { operator: form.operator, number: form.number.replace(/\s+/g, '') }
      : { bank_name: form.bankName, account_name: form.accountName, account_number: form.accountNumber }

    setSubmitting(true)
    try {
      const res = await walletService.requestPayout({ amount, method: form.method, destination })
      toast.success(t('wallet.requestSent', 'Payout requested. It will be reviewed shortly.'))
      setWallet(res.data.wallet)
      setModalOpen(false)
      walletService.getPayouts({ per_page: 20 }).then((r) => setPayouts(extractCollection(r.data, 'payouts')))
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('wallet.requestFailed', 'Unable to request payout.')))
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelPayout(payout) {
    try {
      await walletService.cancelPayout(payout.id)
      toast.success(t('wallet.cancelled', 'Payout request cancelled.'))
      fetchAll()
    } catch (e) {
      toast.error(getApiErrorMessage(e, t('wallet.cancelFailed', 'Unable to cancel payout.')))
    }
  }

  if (loading) return <PageContainer><Loader message={t('wallet.loading', 'Loading your wallet...')} /></PageContainer>
  if (error) return <PageContainer><ErrorState title={t('wallet.errorTitle', 'Wallet error')} message={error} /></PageContainer>

  const rules = wallet?.rules || {}
  const fmt = (v) => formatPrice(v)

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-700 p-8 text-white">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur"><WalletIcon className="h-4 w-4" /> {t('wallet.badge', 'Earnings & payouts')}</span>
        <h1 className="mt-5 text-4xl font-black">{t('wallet.title', 'Your wallet')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{t('wallet.subtitle', 'Track ticket earnings, request payouts, and follow your transactions.')}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {rules.fee_percent != null && <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">{t('wallet.feeNote', { fee: rules.fee_percent, defaultValue: '{{fee}}% platform fee' })}</span>}
          {rules.grace_hours != null && <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">{t('wallet.graceNote', { hours: rules.grace_hours, defaultValue: 'Available {{hours}}h after the event' })}</span>}
          <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">{t('wallet.minNote', { min: fmt(rules.min_payout || 0), defaultValue: 'Min payout {{min}}' })}</span>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Banknote} label={t('wallet.available', 'Available')} value={fmt(wallet.available)} gradient="from-teal-600 to-emerald-700" />
        <StatCard icon={Clock} label={t('wallet.pending', 'Pending (held)')} value={fmt(wallet.pending)} gradient="from-amber-500 to-orange-600" />
        <StatCard icon={TrendingUp} label={t('wallet.lifetime', 'Lifetime earnings')} value={fmt(wallet.lifetime_earnings)} gradient="from-blue-600 to-indigo-700" />
        <StatCard icon={PiggyBank} label={t('wallet.totalPaidOut', 'Total paid out')} value={fmt(wallet.total_paid_out)} gradient="from-purple-600 to-violet-800" />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={openModal} disabled={(wallet.available || 0) <= 0}>{t('wallet.requestPayout', 'Request payout')}</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-black text-slate-950">{t('wallet.payoutsTitle', 'Payout requests')}</h2>
          {payouts.length === 0 ? <EmptyState title={t('wallet.noPayouts', 'No payouts yet')} message={t('wallet.noPayoutsMsg', 'When you request a payout it will appear here.')} /> : (
            <div className="grid gap-3">
              {payouts.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-black text-slate-950">{fmt(p.amount)} <span className="text-sm font-medium text-slate-500">· {p.method === 'bank' ? t('wallet.bank', 'Bank') : t('wallet.mobileMoney', 'Mobile Money')}</span></p>
                    <p className="text-xs text-slate-500">{formatDate(p.createdAt)}</p>
                    {p.reference && <p className="text-xs text-slate-400">{p.reference}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYOUT_STATUSES[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                    {p.status === 'requested' && <Button type="button" variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => cancelPayout(p)}>{t('wallet.cancel', 'Cancel')}</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-black text-slate-950">{t('wallet.transactionsTitle', 'Recent transactions')}</h2>
          {transactions.length === 0 ? <EmptyState title={t('wallet.noTransactions', 'No transactions yet')} message={t('wallet.noTransactionsMsg', 'Ticket sales will appear here once attendees pay.')} /> : (
            <div className="grid gap-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">{tx.eventTitle || tx.description || t('wallet.credit', 'Ticket sale')}</p>
                    <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-700">+{fmt(tx.net)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${CREDIT_STATUSES[tx.status] || 'bg-slate-100 text-slate-600'}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={modalOpen} title={t('wallet.requestPayout', 'Request payout')} onClose={() => setModalOpen(false)}>
        <form onSubmit={submitPayout} className="grid gap-4">
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{t('wallet.availableLabel', 'Available')}: <strong className="text-slate-950">{fmt(wallet.available)}</strong></div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.amount', 'Amount')}</span>
            <Input type="number" min={rules.min_payout || 0} value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} placeholder={rules.min_payout || 10000} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.method', 'Method')}</span>
              <select value={form.method} onChange={(e) => setForm((c) => ({ ...c, method: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-teal-500 focus:bg-white">
                <option value="mobile_money">{t('wallet.mobileMoney', 'Mobile Money')}</option>
                <option value="bank">{t('wallet.bank', 'Bank transfer')}</option>
              </select>
            </label>
            {form.method === 'mobile_money' ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.operator', 'Operator')}</span>
                  <select value={form.operator} onChange={(e) => setForm((c) => ({ ...c, operator: e.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-teal-500 focus:bg-white">
                    <option value="mtn">MTN</option>
                    <option value="orange">Orange</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.mobileNumber', 'Mobile money number')}</span>
                  <Input value={form.number} onChange={(e) => setForm((c) => ({ ...c, number: e.target.value }))} placeholder="6XX XXX XXX" required />
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.bankName', 'Bank name')}</span>
                  <Input value={form.bankName} onChange={(e) => setForm((c) => ({ ...c, bankName: e.target.value }))} placeholder="AFRILAND First Bank" required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.accountName', 'Account name')}</span>
                  <Input value={form.accountName} onChange={(e) => setForm((c) => ({ ...c, accountName: e.target.value }))} required />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-slate-700">{t('wallet.accountNumber', 'Account number')}</span>
                  <Input value={form.accountNumber} onChange={(e) => setForm((c) => ({ ...c, accountNumber: e.target.value }))} required />
                </label>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>{t('cancel', 'Cancel')}</Button>
            <Button type="submit" disabled={submitting}>{submitting ? t('common.saving', 'Submitting...') : t('wallet.requestPayout', 'Request payout')}</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  )
}
