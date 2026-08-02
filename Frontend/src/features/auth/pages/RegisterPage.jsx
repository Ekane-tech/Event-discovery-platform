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
import Etech2 from '../../../assets/E-tech2.png'

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
    if (!form.accountType) return setError(t('auth.chooseAccountType'))
    if (form.accountType === 'organizer' && !form.organizerName.trim()) return setError(t('auth.organizerNameRequired'))
    if (!form.termsAccepted) return setError(t('auth.acceptTerms'))
    if (form.password.length < 8) return setError(t('auth.passwordMinLength'))
    if (!/[a-zA-Z]/.test(form.password)) return setError(t('auth.passwordLetter'))
    if (!/\d/.test(form.password)) return setError(t('auth.passwordNumber'))
    if (form.password !== form.passwordConfirmation) return setError(t('auth.passwordsNotMatch'))

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
          <img src={Etech2} alt="Event crowd" className="h-162.5 w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <Users className="mb-4 h-10 w-10 text-teal-300" />
            <h2 className="text-4xl font-black">{t('auth.registerPageTitle')}</h2>
            <p className="mt-4 max-w-lg text-slate-200">{t('auth.registerPageDescription')}</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-100">
              <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-teal-300" /> {t('auth.bullet1')}</p>
              <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-teal-300" /> {t('auth.bullet2')}</p>
              <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-teal-300" /> {t('auth.registerBenefit2')}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <AuthCard
          eyebrow={t('auth.createAccount')}
          title={t('auth.registerFormTitle')}
          description={t('auth.registerFormDescription')}
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
                  <h3 className="mt-3 font-bold text-slate-950">{t(`auth.${item.value === 'user' ? 'attendEvents' : 'provideServices'}`)}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{t(`auth.${item.value === 'user' ? 'attendeeDescription' : 'organizerDescription'}`)}</p>
                </button>
              )
            })}
          </div>

          {form.accountType && (
              <form onSubmit={handleSubmit} className="grid gap-4">
              <FormInput label={t('auth.fullName')} name="name" value={form.name} onChange={updateField} placeholder={t('auth.fullNamePlaceholder')} required />
              {form.accountType === 'organizer' && <FormInput label={t('auth.organizerName')} name="organizerName" value={form.organizerName} onChange={updateField} placeholder={t('auth.organizerNamePlaceholder')} required />}
              <FormInput label={t('auth.email')} name="email" type="email" value={form.email} onChange={updateField} placeholder={t('auth.emailPlaceholder')} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput label={t('auth.phone')} name="phone" value={form.phone} onChange={updateField} placeholder={t('auth.phonePlaceholder')} />
                <FormInput label={t('auth.city')} name="city" value={form.city} onChange={updateField} placeholder={t('auth.cityPlaceholder')} />
              </div>
              <FormInput label={t('auth.password')} name="password" type="password" value={form.password} onChange={updateField} placeholder={t('auth.passwordPlaceholder')} required />
              <FormInput label={t('auth.confirmPassword')} name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} placeholder={t('auth.confirmPasswordPlaceholder')} required />
              <PasswordChecklist password={form.password} confirmation={form.passwordConfirmation} />

              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <span className="flex gap-3">
                  <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={updateField} className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500" />
                  <span>
                    {t('auth.chooseAccountType')}{' '}
                    <a href={TERMS_URL} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline">{t('footer.terms')}</a> {t('auth.and')} <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="font-bold text-teal-700 underline">{t('footer.privacy')}</a>.
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
