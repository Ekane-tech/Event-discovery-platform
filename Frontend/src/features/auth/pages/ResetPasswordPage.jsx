import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import PasswordChecklist from '../components/PasswordChecklist.jsx'
import { authService } from '../services/authService.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || 'your account'
  const [name, domain] = email.split('@')
  const visible = name.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [form, setForm] = useState({ password: '', passwordConfirmation: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    setEmail(searchParams.get('email') || '')
    setToken(searchParams.get('token') || '')
  }, [searchParams])

  const linkIsValid = useMemo(() => Boolean(email && token), [email, token])

  function updateField(event) {
    setError('')
    setSuccess(false)
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (!email || !token) return setError('This reset link is incomplete or invalid. Please request a new password reset link.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (!/[a-zA-Z]/.test(form.password)) return setError('Password must contain at least one letter.')
    if (!/\d/.test(form.password)) return setError('Password must contain at least one number.')
    if (form.password !== form.passwordConfirmation) return setError('Passwords do not match.')

    setSubmitting(true)

    try {
      await authService.resetPassword({
        email,
        token,
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      })
      setSuccess(true)
      setForm({ password: '', passwordConfirmation: '' })
    } catch (resetError) {
      setError(getApiErrorMessage(resetError, 'Unable to reset password. The link may have expired.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-br from-teal-100 via-white to-pink-100" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <section className="rounded-4xl bg-linear-to-br from-slate-950 to-teal-900 p-8 text-white shadow-2xl shadow-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-teal-100">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-black leading-tight">{t('auth.passwordResetTitle')}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">{t('auth.passwordResetDescription')}</p>
          <div className="mt-6 rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-100">Resetting account</p>
            <p className="mt-2 text-lg font-black">{maskEmail(email)}</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            eyebrow={t('auth.passwordResetTitle')}
            title={t('auth.passwordResetTitle')}
            description={t('auth.passwordResetDescription')}
            footer={<Link className="inline-flex items-center gap-1 font-bold text-teal-700" to="/login"><ArrowLeft className="h-4 w-4" /> {t('auth.backToLogin')}</Link>}
          >
            {success && (
              <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-green-800">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">{t('auth.resetPasswordSuccess')}</p>
                  </div>
                </div>
              </div>
            )}
            {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

            {!linkIsValid && (
              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                {t('auth.resetFailure')}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <input type="hidden" name="email" value={email} readOnly />
              <input type="hidden" name="token" value={token} readOnly />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-700" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Account</p>
                    <p className="text-sm font-bold text-slate-900">{maskEmail(email)}</p>
                  </div>
                </div>
              </div>

              <FormInput label={t('auth.newPassword')} name="password" type="password" value={form.password} onChange={updateField} required autoComplete="new-password" />
              <FormInput label={t('auth.confirmPassword')} name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} required autoComplete="new-password" />
              <PasswordChecklist password={form.password} confirmation={form.passwordConfirmation} />
              <Button type="submit" disabled={submitting || !linkIsValid || success} className="h-12 gap-2 bg-teal-700 hover:bg-teal-800">
                <KeyRound className="h-4 w-4" />
                {submitting ? t('auth.resetting') : t('auth.passwordResetTitle')}
              </Button>
            </form>
          </AuthCard>
        </div>
      </div>
    </main>
  )
}
