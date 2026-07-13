import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Input from '../../../shared/components/ui/Input.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import ErrorState from '../../../shared/components/feedback/ErrorState.jsx'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../shared/components/layout/SectionHeader.jsx'
import { formatPrice } from '../../../shared/utils/currency.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { paymentService } from '../services/paymentService.js'

const OPERATORS = [
  { value: 'mtn', label: 'MTN Mobile Money', logo: '/payments/mtn-momo.svg', hint: 'Pay with MTN MoMo' },
  { value: 'orange', label: 'Orange Money', logo: '/payments/orange-money.svg', hint: 'Pay with Orange Money' },
]

function normalizeCameroonPhone(value) {
  return value.replace(/\s+/g, '')
}

function detectOperator(phone) {
  const digits = phone.replace(/\D+/g, '')
  const local = digits.startsWith('237') ? digits.slice(3) : digits
  if (/^(67|650|651|652|653|654|680|681|682|683|684)/.test(local)) return 'mtn'
  if (/^(69|655|656|657|658|659)/.test(local)) return 'orange'
  return ''
}

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(null)
  const [operator, setOperator] = useState('mtn')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const selectedOperator = useMemo(() => OPERATORS.find((item) => item.value === operator), [operator])

  async function fetchPayment() {
    try {
      const response = await paymentService.getPayment(id)
      setPayment(response.data.payment)
      if (response.data.payment.operator) setOperator(response.data.payment.operator)
      if (response.data.payment.phone_number) setPhoneNumber(response.data.payment.phone_number)
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load payment.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayment() }, [id])

  function updatePhone(value) {
    setPhoneNumber(value)
    const detected = detectOperator(value)
    if (detected) setOperator(detected)
  }

  async function initiatePayment() {
    setProcessing(true)
    setError('')
    setInfo('')
    try {
      const response = await paymentService.initiatePayment(id, {
        operator,
        phone_number: normalizeCameroonPhone(phoneNumber),
      })
      setPayment(response.data.payment)
      setInfo('Payment request initiated. Confirm the prompt on your phone, then click Confirm after payment.')
      toast.success('Mobile money payment request initiated.')
    } catch (paymentError) {
      const message = getApiErrorMessage(paymentError, 'Unable to initiate payment.')
      setError(message)
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  async function confirmPayment() {
    setProcessing(true)
    setError('')
    try {
      await paymentService.confirmPayment(id)
      toast.success('Payment confirmed successfully.')
      navigate('/registrations')
    } catch (paymentError) {
      const message = getApiErrorMessage(paymentError, 'Unable to confirm payment.')
      setError(message)
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <PageContainer><Loader message="Loading payment..." /></PageContainer>
  if (error && !payment) return <PageContainer><ErrorState title="Payment error" message={error} /></PageContainer>

  return (
    <PageContainer>
      <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 bg-cover bg-center p-8 text-white" style={{ backgroundImage: 'linear-gradient(90deg, rgba(2,6,23,.9), rgba(15,118,110,.68)), url(/hero-events.svg)' }}><h1 className="text-4xl font-black">Complete Mobile Money Payment</h1><p className="mt-3 max-w-2xl text-slate-200">Pay securely with MTN Mobile Money or Orange Money and confirm your event registration.</p></section>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <h2 className="font-bold text-slate-950">Payment summary</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p><strong>Event:</strong> {payment.event?.title || 'Event payment'}</p>
            <p><strong>Amount:</strong> {formatPrice(payment.amount)} {payment.currency}</p>
            <p><strong>Reference:</strong> {payment.reference}</p>
            <p><strong>Status:</strong> <span className="capitalize">{payment.status}</span></p>
            {payment.phone_number && <p><strong>Phone:</strong> {payment.phone_number}</p>}
            {payment.operator && <p><strong>Operator:</strong> {payment.operator.toUpperCase()}</p>}
          </div>
        </Card>

        <Card>
          {error && <div className="mb-4"><ErrorState title="Payment error" message={error} /></div>}
          {info && <div className="mb-4"><Alert type="info">{info}</Alert></div>}

          <h2 className="font-bold text-slate-950">Choose payment service</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {OPERATORS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setOperator(item.value)}
                className={`rounded-2xl border p-3 text-left transition ${operator === item.value ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200'}`}
              >
                <img src={item.logo} alt={item.label} className="h-24 w-full rounded-xl object-cover" />
                <p className="mt-3 font-bold text-slate-950">{item.label}</p>
                <p className="text-sm text-slate-500">{item.hint}</p>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Mobile money number</span>
              <Input value={phoneNumber} onChange={(event) => updatePhone(event.target.value)} placeholder="Example: 6XX XXX XXX or +237 6XX XXX XXX" />
            </label>
            <p className="mt-2 text-xs text-slate-500">Selected service: <strong>{selectedOperator?.label}</strong>. You can change it manually.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {payment.status !== 'paid' && <Button onClick={initiatePayment} disabled={processing || !phoneNumber}>{processing ? 'Processing...' : 'Pay Now'}</Button>}
            {['pending', 'processing'].includes(payment.status) && <Button variant="secondary" onClick={confirmPayment} disabled={processing}>Confirm Payment</Button>}
            <Link to="/registrations"><Button variant="outline">Back to Registrations</Button></Link>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
