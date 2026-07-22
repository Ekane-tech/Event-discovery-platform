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
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

const OPERATOR_DEFS = [
  { value: 'mtn', label: 'MTN Mobile Money', logo: '/payments/mtn-momo.svg', hintKey: 'payments.mtnHint', hintDefault: 'Confirm the prompt with your MoMo PIN.' },
  { value: 'orange', label: 'Orange Money', logo: '/payments/orange-money.svg', hintKey: 'payments.orangeHint', hintDefault: 'Confirm the prompt with your Orange Money PIN.' },
]

function normalizeCameroonPhone(value) { return value.replace(/\s+/g, '') }
function detectOperator(phone) { const digits = phone.replace(/\D+/g, ''); const local = digits.startsWith('237') ? digits.slice(3) : digits; if (/^(67|650|651|652|653|654|680|681|682|683|684)/.test(local)) return 'mtn'; if (/^(69|655|656|657|658|659)/.test(local)) return 'orange'; return '' }

function StatusPanel({ payment, checking, onCheck, pollingStopped, t }) {
  if (payment.status === 'paid') {
    return (
      <Card className="border-green-100 bg-green-50">
        <div className="flex gap-4">
          <CheckCircle2 className="h-10 w-10 shrink-0 text-green-700" />
          <div>
            <h2 className="text-2xl font-black text-green-900">{t('payments.confirmedTitle', 'Payment confirmed')}</h2>
            <p className="mt-2 text-sm leading-6 text-green-800">{t('payments.confirmedMessage', 'Your registration has been confirmed. You can now view your registration details and ticket.')}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Link to="/registrations"><Button>{t('payments.viewRegistrations', 'View registrations')}</Button></Link>{payment.event_id && <Link to={`/tickets/${payment.event_id}`}><Button variant="secondary">{t('payments.viewTicket', 'View ticket')}</Button></Link>}</div>
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
            <h2 className="text-2xl font-black text-amber-950">{t('payments.awaitingTitle', 'Awaiting phone confirmation')}</h2>
            {pollingStopped ? (
              <p className="mt-2 text-sm leading-6 text-amber-900">{t('payments.pollingStoppedMessage', "We're still waiting for the payment provider. You can leave this page and come back later, or click 'Check payment status' to manually refresh.")}</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-amber-900">{t('payments.processingMessage', 'A payment request has been sent to your phone. Confirm it with your mobile money PIN, then wait for automatic update or check manually.')}</p>
            )}
            <Button type="button" variant="secondary" className="mt-4" onClick={onCheck} disabled={checking}><RefreshCw className="mr-2 h-4 w-4" />{checking ? t('payments.checking', 'Checking...') : t('payments.checkStatus', 'Check payment status')}</Button>
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
            <h2 className="text-2xl font-black text-red-950">{t('payments.failedTitle', 'Payment failed')}</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">{payment.failure_reason || t('payments.failedDefault', 'The previous payment attempt was not completed. You can try again with the same or another mobile money number.')}</p>
          </div>
        </div>
      </Card>
    )
  }

  return null
}

export default function PaymentPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  const [payment, setPayment] = useState(null)
  const [operator, setOperator] = useState('mtn')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [pollingStopped, setPollingStopped] = useState(false)

  const POLLING_TIMEOUT_MS = 5 * 60 * 1000 // 05 minutes
  const POLLING_INTERVAL_MS = 20000 // 20 seconds

  const OPERATORS = useMemo(() => OPERATOR_DEFS.map((item) => ({ ...item, hint: t(item.hintKey, item.hintDefault) })), [t])
  const selectedOperator = useMemo(() => OPERATORS.find((item) => item.value === operator), [OPERATORS, operator])
  const providerIsLive = payment?.provider === 'campay'
  const canCheckStatus = payment && ['pending', 'processing'].includes(payment.status)
  const paymentLocked = payment && ['processing', 'paid'].includes(payment.status)

  function statusLabel(status) { if (status === 'paid') return t('payments.statusPaid', 'Paid'); if (status === 'processing') return t('payments.statusProcessing', 'Awaiting phone confirmation'); if (status === 'failed') return t('payments.statusFailed', 'Failed'); return t('payments.statusPending', 'Pending') }

  async function fetchPayment({ silent = false } = {}) {
    try {
      const response = await paymentService.getPayment(id)
      setPayment(response.data.payment)
      if (response.data.payment.operator) setOperator(response.data.payment.operator)
      if (response.data.payment.phone_number) setPhoneNumber(response.data.payment.phone_number)
    } catch (fetchError) { if (!silent) setError(getApiErrorMessage(fetchError, t('payments.loadError', 'Unable to load payment.'))) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPayment() }, [id])

  useEffect(() => {
    if (user?.phone && !phoneNumber) {
      setPhoneNumber(user.phone)
      const detected = detectOperator(user.phone)
      if (detected) setOperator(detected)
    }
  }, [user, phoneNumber])

  useEffect(() => {
    if (!payment || !['pending', 'processing'].includes(payment.status)) {
      setPollingStopped(false)
      return undefined
    }

    setPollingStopped(false)
    const startTime = Date.now()

    const timer = window.setInterval(async () => {
      const elapsed = Date.now() - startTime

      if (elapsed >= POLLING_TIMEOUT_MS) {
        window.clearInterval(timer)
        setPollingStopped(true)
        return
      }

      try {
        const response = await paymentService.getPaymentStatus(id)
        setPayment(response.data.payment)
        if (response.data.payment.status === 'paid') toast.success(t('payments.toastCompleted', 'Payment completed successfully.'))
      } catch {}
    }, POLLING_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [id, payment?.status])

  function updatePhone(value) { setPhoneNumber(value); const detected = detectOperator(value); if (detected) setOperator(detected) }

  async function initiatePayment() {
    setProcessing(true); setError(''); setInfo('')
    try {
      const response = await paymentService.initiatePayment(id, { operator, phone_number: normalizeCameroonPhone(phoneNumber) })
      setPayment(response.data.payment)
      if (response.data.payment.status === 'paid') { toast.success(t('payments.toastCompleted', 'Payment completed successfully.')); return }
      setInfo(t('payments.infoRequestSent', 'Payment request sent. Confirm the prompt on your phone, then wait for automatic confirmation or click Check payment status.'))
      toast.success(t('payments.toastRequestSent', 'Payment request sent to your phone.'))
    } catch (paymentError) {
      const message = getApiErrorMessage(paymentError, t('payments.initiateError', 'Unable to initiate payment.'))
      setError(message); toast.error(message)
    } finally { setProcessing(false) }
  }

  async function checkPaymentStatus() {
    setChecking(true); setError('')
    try {
      const response = await paymentService.confirmPayment(id)
      setPayment(response.data.payment)
      if (response.data.payment.status === 'paid') toast.success(t('payments.toastConfirmed', 'Payment confirmed successfully.'))
      else setInfo(response.data.message || t('payments.infoStillPending', 'Payment is still pending. Confirm the prompt on your phone and check again.'))
    } catch (paymentError) {
      const message = getApiErrorMessage(paymentError, t('payments.checkError', 'Unable to check payment status.'))
      setError(message); toast.error(message)
    } finally { setChecking(false) }
  }

  if (loading) return <PageContainer><Loader message={t('payments.loading', 'Loading payment...')} /></PageContainer>
  if (error && !payment) return <PageContainer><ErrorState title={t('payments.errorTitle', 'Payment error')} message={error} /></PageContainer>

  return (
    <PageContainer>
      <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)' }}>
        <h1 className="text-4xl font-black">{t('payments.title', 'Complete Mobile Money Payment')}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{t('payments.subtitle', 'Pay securely with MTN Mobile Money or Orange Money and confirm your event registration.')}</p>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4">
          <Card><h2 className="font-bold text-slate-950">{t('payments.summaryTitle', 'Payment summary')}</h2><div className="mt-4 grid gap-3 text-sm text-slate-700"><p><strong>{t('payments.eventLabel', 'Event:')}</strong> {payment.event?.title || t('payments.eventFallback', 'Event payment')}</p><p><strong>{t('payments.amountLabel', 'Amount:')}</strong> {formatPrice(payment.amount)} {payment.currency}</p><p><strong>{t('payments.referenceLabel', 'Reference:')}</strong> {payment.reference}</p><p><strong>{t('payments.statusLabel', 'Status:')}</strong> <span className="capitalize">{statusLabel(payment.status)}</span></p>{payment.phone_number && <p><strong>{t('payments.phoneLabel', 'Phone:')}</strong> {payment.phone_number}</p>}{payment.operator && <p><strong>{t('payments.operatorLabel', 'Operator:')}</strong> {payment.operator.toUpperCase()}</p>}{payment.metadata?.ussd_code && <p><strong>{t('payments.ussdLabel', 'USSD:')}</strong> {payment.metadata.ussd_code}</p>}</div>{providerIsLive && <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-900">{t('payments.providerLiveMessage', 'This transaction is processed by the mobile money provider. Complete the prompt on your phone to finish payment.')}</div>}</Card>
          <StatusPanel payment={payment} checking={checking} onCheck={checkPaymentStatus} pollingStopped={pollingStopped} t={t} />
        </div>

        <Card className="relative overflow-hidden">
          {(processing || payment.status === 'processing') && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-sm"><div className="rounded-3xl bg-white p-5 text-center shadow-xl"><Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" /><p className="mt-3 font-bold text-slate-950">{processing ? t('payments.sendingRequest', 'Sending payment request...') : t('payments.waitingConfirmation', 'Waiting for phone confirmation...')}</p></div></div>}
          {error && <div className="mb-4"><ErrorState title={t('payments.errorTitle', 'Payment error')} message={error} /></div>}
          {info && <div className="mb-4"><Alert type="info">{info}</Alert></div>}
          <h2 className="font-bold text-slate-950">{t('payments.chooseService', 'Choose payment service')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{OPERATORS.map((item) => <button key={item.value} type="button" onClick={() => setOperator(item.value)} disabled={paymentLocked || processing || checking} className={`rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${operator === item.value ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200'}`}><img src={item.logo} alt={item.label} className="h-24 w-full rounded-xl object-cover" /><p className="mt-3 font-bold text-slate-950">{item.label}</p><p className="text-sm text-slate-500">{item.hint}</p></button>)}</div>
          <div className="mt-5"><label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{t('payments.numberLabel', 'Mobile money number')}</span><Input value={phoneNumber} onChange={(event) => updatePhone(event.target.value)} placeholder={t('payments.numberPlaceholder', 'Example: 6XX XXX XXX or +237 6XX XXX XXX')} disabled={paymentLocked || processing || checking} /></label><p className="mt-2 text-xs text-slate-500">{t('payments.selectedService', { service: selectedOperator?.label, defaultValue: 'Selected service: {{service}}. You can change it manually before starting a payment request.' })}</p></div>
          <div className="mt-6 flex flex-wrap gap-2">{!['paid', 'processing'].includes(payment.status) && <Button onClick={initiatePayment} disabled={processing || !phoneNumber}>{processing ? t('payments.sendingRequestShort', 'Sending request...') : payment.status === 'failed' ? t('payments.tryAgain', 'Try Again') : t('payments.payNow', 'Pay Now')}</Button>}{canCheckStatus && <Button variant="secondary" onClick={checkPaymentStatus} disabled={checking}><RefreshCw className="mr-2 h-4 w-4" />{checking ? t('payments.checking', 'Checking...') : t('payments.checkStatus', 'Check payment status')}</Button>}<Link to="/registrations"><Button variant="outline">{t('payments.back', 'Back to Registrations')}</Button></Link></div>
        </Card>
      </div>
    </PageContainer>
  )
}
