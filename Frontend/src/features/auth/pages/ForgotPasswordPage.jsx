import { ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { authService } from '../services/authService.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

// message fallback when API doesn't return one
// uses i18n at render time

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSent(false)
    setSubmitting(true)

    try {
      const response = await authService.forgotPassword({ email })
      setMessage(response.data.message || SAFE_RESET_MESSAGE)
      setSent(true)
    } catch (forgotError) {
      setError(getApiErrorMessage(forgotError, 'Please enter a valid email address and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-br from-teal-100 via-white to-pink-100" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <section className="rounded-4xl bg-slate-950 p-8 text-white shadow-2xl shadow-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400 text-slate-950">
            <ShieldCheck className="h-7 w-7" />
          </div>
            <h2 className="mt-6 text-3xl font-black leading-tight">{t('auth.forgotPasswordTitle')}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{t('auth.forgotPasswordDescription')}</p>
          <div className="mt-6 grid gap-3 text-sm text-slate-200">
            <p className="rounded-2xl bg-white/10 p-4">Reset links are time-limited for your safety.</p>
            <p className="rounded-2xl bg-white/10 p-4">We never reveal whether an email is registered.</p>
            <p className="rounded-2xl bg-white/10 p-4">After reset, old sessions are signed out.</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            eyebrow={t('auth.forgotPasswordTitle')}
            title={t('auth.forgotPasswordTitle')}
            description={t('auth.forgotPasswordDescription')}
            footer={<><Link className="inline-flex items-center gap-1 font-bold text-teal-700" to="/login"><ArrowLeft className="h-4 w-4" /> {t('auth.backToLogin')}</Link> <span className="text-slate-400">{t('or', 'or')}</span> <Link className="font-bold text-teal-700" to="/register">{t('auth.createAccount')}</Link></>}
          >
            {sent && <div className="mb-5"><Alert type="success">{message || t('auth.safeResetMessage')}</Alert></div>}
            {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <FormInput label={t('auth.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
              <Button type="submit" disabled={submitting} className="h-12 gap-2 bg-teal-700 hover:bg-teal-800">
                <MailCheck className="h-4 w-4" />
                {submitting ? t('auth.sending') : t('auth.sendResetLink')}
              </Button>
            </form>

            {sent && (
              <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
                {t('auth.safeResetMessage')}
              </div>
            )}
          </AuthCard>
        </div>
      </div>
    </main>
  )
}
