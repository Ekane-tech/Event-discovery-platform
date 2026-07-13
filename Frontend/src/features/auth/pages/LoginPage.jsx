import { ArrowRight, CalendarCheck, ShieldCheck, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'
import { useAuth } from '../hooks/useAuth.js'
import { getDashboardPathByRole } from '../utils/authRedirects.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const quickAccess = [
    { title: t('auth.attendee'), description: t('auth.attendeeDescription'), icon: Ticket, email: 'user@example.com' },
    { title: t('auth.organizer'), description: t('auth.organizerDescription'), icon: CalendarCheck, email: 'organizer@example.com' },
  ]

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseAccount(email) {
    setForm({ email, password: '' })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const loggedInUser = await login(form)
      navigate(location.state?.from?.pathname || getDashboardPathByRole(loggedInUser.role), { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-220px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-8 lg:py-14">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-slate-950 bg-cover bg-center p-10 text-white lg:block" style={{ backgroundImage: 'linear-gradient(140deg, rgba(2,6,23,.82), rgba(15,118,110,.6)), url(/hero-events.svg)' }}>
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">{t('auth.welcomeBack')}</span>
            <h2 className="mt-6 max-w-xl text-5xl font-black leading-tight">{t('auth.loginHeadline')}</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-100">{t('auth.loginPanelDescription')}</p>
          </div>
          <div className="grid gap-4">
            {quickAccess.map((item) => {
              const Icon = item.icon
              return (
                <button key={item.title} onClick={() => chooseAccount(item.email)} className="rounded-3xl bg-white/10 p-5 text-left backdrop-blur transition hover:bg-white/15">
                  <div className="flex gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon className="h-5 w-5" /></span>
                    <span>
                      <strong>{item.title}</strong>
                      <span className="mt-1 block text-sm text-slate-200">{item.description}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="flex items-center">
        <AuthCard
          eyebrow={t('auth.secureLogin')}
          title={t('auth.signIn')}
          description={t('auth.loginPanelDescription')}
          footer={<> {t('auth.noAccount')} <Link className="font-bold text-teal-700" to="/register">{t('auth.createAccount')}</Link></>}
        >
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:hidden">
            {quickAccess.map((item) => {
              const Icon = item.icon
              return (
                <button key={item.title} onClick={() => chooseAccount(item.email)} className="rounded-2xl border border-slate-200 p-3 text-left hover:border-teal-300 hover:bg-teal-50">
                  <Icon className="h-5 w-5 text-teal-700" />
                  <p className="mt-2 font-bold">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            <FormInput label={t('auth.email')} name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
            <FormInput label={t('auth.password')} name="password" type="password" value={form.password} onChange={updateField} placeholder="Your password" required />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 accent-teal-600" defaultChecked />
                {t('auth.rememberMe')}
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-teal-700">{t('auth.forgotPassword')}</Link>
            </div>
            {error && <Alert type="error">{error}</Alert>}
            <Button type="submit" disabled={submitting} variant="pink" className="h-11 gap-2">
              {submitting ? t('auth.signingIn') : t('auth.signIn')}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mb-2 h-4 w-4 text-teal-700" />
            {t('auth.accountProtected')}
          </div>
        </AuthCard>
      </section>
    </main>
  )
}
