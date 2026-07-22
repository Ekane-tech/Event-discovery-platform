import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const { login, isAuthenticated, role, loading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDashboardPathByRole(role), { replace: true })
    }
  }, [isAuthenticated, role, loading, navigate])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
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
      <section className="relative hidden overflow-hidden rounded-4xl bg-slate-950 bg-cover bg-center p-10 text-white lg:block" style={{ backgroundImage: 'linear-gradient(140deg, rgba(2,6,23,.82), rgba(15,118,110,.6)), url(/hero-events.svg)' }}>
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">{t('auth.welcomeBack')}</span>
            <h2 className="mt-6 max-w-xl text-5xl font-black leading-tight">{t('auth.loginHeadline')}</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-100">{t('auth.loginPanelDescription')}</p>
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
