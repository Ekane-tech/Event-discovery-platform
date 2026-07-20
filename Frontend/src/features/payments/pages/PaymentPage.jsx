import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Loader2, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { formatPrice } from '../../../shared/utils/currency.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { paymentService } from '../services/paymentService.js'

const OPERATORS = [
  { value: 'mtn', label: 'MTN Mobile Money', logo: '/payments/mtn-momo.svg', hint: 'Confirm the prompt with your MoMo PIN.' },
  { value: 'orange', label: 'Orange Money', logo: '/payments/orange-money.svg', hint: 'Confirm the prompt with your Orange Money PIN.' },
]

function normalizeCameroonPhone(value) { return value.replace(/\s+/g, '') }
function detectOperator(phone) { const digits = phone.replace(/\D+/g, ''); const local = digits.startsWith('237') ? digits.slice(3) : digits; if (/^(67|650|651|652|653|654|680|681|682|683|684)/.test(local)) return 'mtn'; if (/^(69|655|656|657|658|659)/.test(local)) return 'orange'; return '' }
function statusLabel(status) { if (status === 'paid') return 'Paid'; if (status === 'processing') return 'Awaiting phone confirmation'; if (status === 'failed') return 'Failed'; return 'Pending' }

function StatusPanel({ payment, checking, onCheck }) {
  if (payment.status === 'paid') {
    return (
      <Card className="border-green-100 bg-green-50">
        <div className="flex gap-4">
          <CheckCircle2 className="h-10 w-10 shrink-0 text-green-700" />
          <div>
            <h2 className="text-2xl font-black text-green-900">Payment confirmed</h2>
            <p className="mt-2 text-sm leading-6 text-green-800">Your registration has been confirmed. You can now view your registration details and ticket.</p>
            <div className="mt-4 flex flex-wrap gap-2"><Link to="/registrations"><Button>View registrations</Button></Link>{payment.event_id && <Link to={`/tickets/${payment.event_id}`}><Button variant="secondary">View ticket</Button></Link>}</div>
          </div>
        </div>
      </Card>
    )
  }

  if (payment.status === 'processing') {
    return (
      <Card className="border-amber-100 bg-amber-50">
        <div className="flex gap-4">
          <Loader2 className="h-10 w-10 shrink-0 animate-spin text-amber-700" />
          <div>
            <h2 className="text-2xl font-black text-amber-950">Awaiting phone confirmation</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">A payment request has been sent to your phone. Confirm it with your mobile money PIN, then wait for automatic update or check manually.</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={onCheck} disabled={checking}><RefreshCw className="mr-2 h-4 w-4" />{checking ? 'Checking...' : 'Check payment status'}</Button>
          </div>
        </div>
      </Card>
    )
  }

  if (payment.status === 'failed') {
    return (
      <Card className="border-red-100 bg-red-50">
        <div className="flex gap-4">
          <Clock3 className="h-10 w-10 shrink-0 text-red-700" />
          <div>
            <h2 className="text-2xl font-black text-red-950">Payment failed</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">{payment.failure_reason || 'The previous payment attempt was not completed. You can try again with the same or another mobile money number.'}</p>
          </div>
        </div>
      </Card>
    )
  }

  return null
}

export default function PaymentPage() {
  const { id } = useParams()
  const [payment, setPayment] = useState(null)
  const [operator, setOperator] = useState('mtn')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const selectedOperator = useMemo(() => OPERATORS.find((item) => item.value === operator), [operator])
  const providerIsLive = payment?.provider === 'campay'
  const canCheckStatus = payment && ['pending', 'processing'].includes(payment.status)
  const paymentLocked = payment && ['processing', 'paid'].includes(payment.status)

  async function fetchPayment({ silent = false } = {}) {
    try {
      const response = await paymentService.getPayment(id)
      setPayment(response.data.payment)
      if (response.data.payment.operator) setOperator(response.data.payment.operator)
      if (response.data.payment.phone_number) setPhoneNumber(response.data.payment.phone_number)
    } catch (fetchError) { if (!silent) setError(getApiErrorMessage(fetchError, 'Unable to load payment.')) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPayment() }, [id])

  useEffect(() => {
    if (!payment || !['pending', 'processing'].includes(payment.status)) return undefined
    const timer = window.setInterval(async () => {
      try {
        const response = await paymentService.getPaymentStatus(id)
        setPayment(response.data.payment)
        if (response.data.payment.status === 'paid') toast.success('Payment completed successfully.')
      } catch {}
    }, 60000)
    return () => window.clearInterval(timer)
  }, [id, payment?.status])

  function updatePhone(value) { setPhoneNumber(value); const detected = detectOperator(value); if (detected) setOperator(detected) }

  async function initiatePayment() {
    setProcessing(true); setError(''); setInfo('')
    try {
      const response = await paymentService.initiatePayment(id, { operator, phone_number: normalizeCameroonPhone(phoneNumber) })
      setPayment(response.data.payment)
      if (response.data.payment.status === 'paid') { toast.success('Payment completed successfully.'); return }
      setInfo('Payment request sent. Confirm the prompt on your phone, then wait for automatic confirmation or click Check payment status.')
      toast.success('Payment request sent to your phone.')
    } catch (paymentError) {
      const message = getApiErrorMessage(paymentError, 'Unable to initiate payment.')
      setError(message); toast.error(message)
    } finally { setProcessing(false) }
  }

  async function checkPaymentStatus() {
    setChecking(true); setError('')
    try {
      const response = await paymentService.confirmPayment(id)
      setPayment(response.data.payment)
      if (response.data.payment.status === 'paid') toast.success('Payment confirmed successfully.')
      else setInfo(response.data.message || 'Payment is still pending. Confirm the prompt on your phone and check again.')
    } catch (paymentError) {
      const message = getApiErrorMessage(paymentError, 'Unable to check payment status.')
      setError(message); toast.error(message)
    } finally { setChecking(false) }
  }

  if (loading) return <PageContainer><Loader message="Loading payment..." /></PageContainer>
  if (error && !payment) return <PageContainer><ErrorState title="Payment error" message={error} /></PageContainer>

  return (
    <PageContainer>
      <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <h1 className="text-4xl font-black">Complete Mobile Money Payment</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Pay securely with MTN Mobile Money or Orange Money and confirm your event registration.</p>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4">
          <Card><h2 className="font-bold text-slate-950">Payment summary</h2><div className="mt-4 grid gap-3 text-sm text-slate-700"><p><strong>Event:</strong> {payment.event?.title || 'Event payment'}</p><p><strong>Amount:</strong> {formatPrice(payment.amount)} {payment.currency}</p><p><strong>Reference:</strong> {payment.reference}</p><p><strong>Status:</strong> <span className="capitalize">{statusLabel(payment.status)}</span></p>{payment.phone_number && <p><strong>Phone:</strong> {payment.phone_number}</p>}{payment.operator && <p><strong>Operator:</strong> {payment.operator.toUpperCase()}</p>}{payment.metadata?.ussd_code && <p><strong>USSD:</strong> {payment.metadata.ussd_code}</p>}</div>{providerIsLive && <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-900">This transaction is processed by the mobile money provider. Complete the prompt on your phone to finish payment.</div>}</Card>
          <StatusPanel payment={payment} checking={checking} onCheck={checkPaymentStatus} />
        </div>

        <Card className="relative overflow-hidden">
          {(processing || payment.status === 'processing') && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-sm"><div className="rounded-3xl bg-white p-5 text-center shadow-xl"><Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" /><p className="mt-3 font-bold text-slate-950">{processing ? 'Sending payment request...' : 'Waiting for phone confirmation...'}</p></div></div>}
          {error && <div className="mb-4"><ErrorState title="Payment error" message={error} /></div>}
          {info && <div className="mb-4"><Alert type="info">{info}</Alert></div>}
          <h2 className="font-bold text-slate-950">Choose payment service</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{OPERATORS.map((item) => <button key={item.value} type="button" onClick={() => setOperator(item.value)} disabled={paymentLocked || processing || checking} className={`rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${operator === item.value ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200'}`}><img src={item.logo} alt={item.label} className="h-24 w-full rounded-xl object-cover" /><p className="mt-3 font-bold text-slate-950">{item.label}</p><p className="text-sm text-slate-500">{item.hint}</p></button>)}</div>
          <div className="mt-5"><label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Mobile money number</span><Input value={phoneNumber} onChange={(event) => updatePhone(event.target.value)} placeholder="Example: 6XX XXX XXX or +237 6XX XXX XXX" disabled={paymentLocked || processing || checking} /></label><p className="mt-2 text-xs text-slate-500">Selected service: <strong>{selectedOperator?.label}</strong>. You can change it manually before starting a payment request.</p></div>
          <div className="mt-6 flex flex-wrap gap-2">{!['paid', 'processing'].includes(payment.status) && <Button onClick={initiatePayment} disabled={processing || !phoneNumber}>{processing ? 'Sending request...' : payment.status === 'failed' ? 'Try Again' : 'Pay Now'}</Button>}{canCheckStatus && <Button variant="secondary" onClick={checkPaymentStatus} disabled={checking}><RefreshCw className="mr-2 h-4 w-4" />{checking ? 'Checking...' : 'Check payment status'}</Button>}<Link to="/registrations"><Button variant="outline">Back to Registrations</Button></Link></div>
        </Card>
      </div>
    </PageContainer>
  )
}
