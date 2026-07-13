import { CreditCard, Search, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { formatPrice } from '../../../../shared/utils/currency.js'
import { adminService } from '../services/adminService.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'

function normalizePayment(payment) {
  return {
    id: payment.id,
    reference: payment.reference,
    event: payment.event?.title || '—',
    attendee: payment.user?.name || '—',
    email: payment.user?.email || '—',
    amount: formatPrice(payment.amount),
    rawAmount: Number(payment.amount || 0),
    status: payment.status,
    provider: payment.provider,
    operator: payment.operator || '—',
    phone: payment.phone_number || '—',
    paidAt: payment.paid_at ? formatDate(payment.paid_at) : '—',
    createdAt: formatDate(payment.created_at),
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ keyword: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchPayments() {
    setLoading(true)
    setError('')
    try {
      const [paymentsResponse, summaryResponse] = await Promise.all([
        adminService.getPayments({ ...filters, per_page: 50 }),
        adminService.getPaymentSummary(),
      ])
      setPayments(extractCollection(paymentsResponse.data, 'payments').map(normalizePayment))
      setSummary(summaryResponse.data.summary || {})
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load payment tracking.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [filters.status])

  const visiblePayments = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    if (!keyword) return payments
    return payments.filter((payment) => [payment.reference, payment.event, payment.attendee, payment.email, payment.phone].some((value) => String(value || '').toLowerCase().includes(keyword)))
  }, [payments, filters.keyword])

  if (loading) return <PageContainer><Loader message="Loading payment tracking..." /></PageContainer>
  if (error) return <PageContainer><ErrorState title="Payment tracking error" message={error} /></PageContainer>

  return (
    <PageContainer>
      <SectionHeader title="Payment Tracking" description="Monitor event payments, pending revenue and completed mobile money transactions." />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ['Total revenue', formatPrice(summary?.total_revenue || 0), 'from-teal-600 to-emerald-700'],
          ['Pending revenue', formatPrice(summary?.pending_revenue || 0), 'from-amber-500 to-orange-700'],
          ['Paid payments', summary?.paid_payments || 0, 'from-blue-600 to-indigo-700'],
          ['Pending payments', summary?.pending_payments || 0, 'from-slate-600 to-slate-800'],
        ].map(([label, value, gradient]) => (
          <div key={label} className={`rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}>
            <WalletCards className="h-6 w-6 text-white/90" />
            <p className="mt-3 text-sm text-white/80">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Transactions</h2>
            <p className="text-sm text-slate-600">Search by attendee, event, phone or reference.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="rounded-2xl border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500" value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} placeholder="Search payments" />
            </div>
            <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal-500" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      <Table
        columns={[
          { key: 'reference', label: 'Reference' },
          { key: 'event', label: 'Event' },
          { key: 'attendee', label: 'Attendee' },
          { key: 'amount', label: 'Amount' },
          { key: 'status', label: 'Status' },
          { key: 'operator', label: 'Operator' },
          { key: 'phone', label: 'Phone' },
          { key: 'paidAt', label: 'Paid' },
          { key: 'createdAt', label: 'Created' },
        ]}
        rows={visiblePayments.map((payment) => ({
          ...payment,
          reference: <span className="inline-flex items-center gap-1 font-mono text-xs"><CreditCard className="h-3.5 w-3.5 text-teal-700" />{payment.reference}</span>,
          status: <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-700">{payment.status}</span>,
        }))}
      />
    </PageContainer>
  )
}
