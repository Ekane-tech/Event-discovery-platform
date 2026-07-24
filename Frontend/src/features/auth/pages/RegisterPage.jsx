import { ArrowRight, CalendarCheck, CheckCircle2, Ticket, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import PasswordChecklist from '../components/PasswordChecklist.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import { useAuth } from '../hooks/useAuth.js'
import { getDashboardPathByRole } from '../utils/authRedirects.js'

const TERMS_URL = '/terms-of-service'
const PRIVACY_URL = '/privacy-policy'

const ACCOUNT_TYPES = [
  { value: 'user', title: 'Attend events', description: 'Discover events, save favorites, register and manage tickets.', icon: Ticket },
  { value: 'organizer', title: 'Organize events', description: 'Create events, manage attendees, upload images and track performance.', icon: CalendarCheck },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { register, isAuthenticated, role, loading } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    accountType: '',
    name: '',
    organizerName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    passwordConfirmation: '',
    termsAccepted: false,
  })

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDashboardPathByRole(role), { replace: true })
    }
  }, [isAuthenticated, role, loading, navigate])

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setError('')
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function chooseAccountType(accountType) {
    setError('')
    setForm((current) => ({ ...current, accountType }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!form.accountType) return setError('Please choose how you want to use the platform.')
    if (form.accountType === 'organizer' && !form.organizerName.trim()) return setError('Organizer name is required.')
    if (!form.termsAccepted) return setError('Please accept the Terms of service and Privacy policy to continue.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (!/[a-zA-Z]/.test(form.password)) return setError('Password must contain at least one letter.')
    if (!/\d/.test(form.password)) return setError('Password must contain at least one number.')
    if (form.password !== form.passwordConfirmation) return setError('Passwords do not match.')

    setSubmitting(true)
    try {
      const user = await register(form)
      navigate(user.emailVerifiedAt ? getDashboardPathByRole(user.role) : '/verify-email?status=initial', { replace: true })
    } catch (registerError) {
      setError(registerError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_560px] lg:px-8 lg:py-14">
      <section className="hidden lg:block">
        <div className="sticky top-28 overflow-hidden rounded-4xl bg-slate-950 shadow-2xl">
          <img src="/hero-events.svg" alt="Event crowd" className="h-162.5 w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <Users className="mb-4 h-10 w-10 text-teal-300" />
            <h2 className="text-4xl font-black">Join the event ecosystem.</h2>
            <p className="mt-4 max-w-lg text-slate-200">Create an attendee account or register your organizer profile in a few steps.</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-100">
              <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-teal-300" /> Discover events across Cameroon.</p>
              <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-teal-300" /> Manage registrations, tickets and check-ins.</p>
              <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-teal-300" /> {t('auth.registerBenefit2', 'Receive important updates by email.')}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <AuthCard
          eyebrow={t('auth.createAccount')}
          title={t('auth.registerTitle', 'Create your account')}
          description={t('auth.registerDescription')}
          footer={<>{t('auth.alreadyAccount')} <Link className="font-bold text-teal-700" to="/login">{t('auth.signIn')}</Link></>}
        >
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            {ACCOUNT_TYPES.map((item) => {
              const Icon = item.icon
              const active = form.accountType === item.value
              return (
                <button key={item.value} type="button" onClick={() => chooseAccountType(item.value)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'}`}>
                  <Icon className="h-6 w-6 text-teal-700" />
                  <h3 className="mt-3 font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                </button>
              )
            })}
          </div>

          {form.accountType && (
              <form onSubmit={handleSubmit} className="grid gap-4">
              <FormInput label={t('auth.fullName')} name="name" value={form.name} onChange={updateField} placeholder={t('auth.fullName')} required />
              {form.accountType === 'organizer' && <FormInput label={t('auth.organizerName', 'Organizer name')} name="organizerName" value={form.organizerName} onChange={updateField} placeholder={t('auth.organizerName', 'Company, brand or organizer name')} required />}
              <FormInput label={t('auth.email')} name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput label={t('auth.phone')} name="phone" value={form.phone} onChange={updateField} placeholder="+237 6XX XXX XXX" />
                <FormInput label={t('auth.city')} name="city" value={form.city} onChange={updateField} placeholder="Douala" />
              </div>
              <FormInput label={t('auth.password')} name="password" type="password" value={form.password} onChange={updateField} placeholder="Example: password1" required />
              <FormInput label={t('auth.confirmPassword')} name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} required />
              <PasswordChecklist password={form.password} confirmation={form.passwordConfirmation} />

              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <span className="flex gap-3">
                  <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={updateField} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500" />
                  <span>
                    {t('auth.chooseAccountType')}{' '}
                    <a href={TERMS_URL} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline">{t('footer.terms')}</a> {t('and', 'and')} <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline">{t('footer.privacy')}</a>.
                  </span>
                </span>
              </label>

              <Button type="submit" disabled={submitting} variant="pink" className="h-12 gap-2">
                {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </AuthCard>
      </section>
    </main>
  )
}
