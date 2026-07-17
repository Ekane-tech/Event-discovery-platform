import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { authService } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || 'your email address'
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`
}

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, refreshUser } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const status = searchParams.get('status')
  const verified = Boolean(user?.emailVerifiedAt)
  const maskedEmail = useMemo(() => maskEmail(user?.email), [user?.email])
  const { t } = useTranslation()

  useEffect(() => {
    if (status === 'verified') {
      setMessage(t('auth.emailVerifiedSuccess'))
      if (isAuthenticated) refreshUser().catch(() => {})
      return
    }

    if (status === 'required') {
      setError(t('auth.verifyEmailDescription'))
      return
    }

    if (status === 'sent') {
      setMessage(t('auth.verificationEmailResent'))
    }
  }, [status, isAuthenticated, refreshUser, t])

  async function resendEmail() {
    setSending(true)
    setError('')
    setMessage('')
    try {
      const response = await authService.resendVerificationEmail()
      setMessage(response.data.message || 'Verification email sent successfully.')
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, 'Unable to resend verification email.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-br from-teal-100 via-white to-pink-100" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <section className="rounded-4xl bg-linear-to-br from-slate-950 to-teal-900 p-8 text-white shadow-2xl shadow-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-teal-100">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-black leading-tight">{t('auth.verifyEmailTitle')}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">{t('auth.verifyEmailDescription')}</p>
          <div className="mt-6 rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-100">Verification email sent to</p>
            <p className="mt-2 text-lg font-black">{maskedEmail}</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            eyebrow={verified ? t('auth.emailVerifiedSuccess') : t('auth.verifyEmailTitle')}
            title={verified ? t('auth.emailVerifiedSuccess') : t('auth.verifyEmailTitle')}
            description={verified ? t('auth.emailVerifiedDescription') : t('auth.verifyEmailDescription')}
            footer={<><Link className="font-bold text-teal-700" to="/login">{t('auth.backToLogin')}</Link>{verified && <> {t('or', 'or')} <Link className="font-bold text-teal-700" to="/dashboard">{t('auth.createAccount')}</Link></>}</>}
          >
            {message && <div className="mb-5"><Alert type="success">{message}</Alert></div>}
            {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

            <div className="flex justify-center">
              <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${verified ? 'bg-green-50 text-green-700' : 'bg-teal-50 text-teal-700'}`}>
                <MailCheck className="h-12 w-12" />
              </div>
            </div>

            {!verified && isAuthenticated && (
              <div className="mt-6 grid gap-3">
                <Button className="h-12 w-full bg-teal-700 hover:bg-teal-800" type="button" onClick={resendEmail} disabled={sending}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                    {sending ? t('auth.sending') : t('auth.resendVerificationEmail')}
                </Button>
                <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  After clicking the verification button in your email, this page will show a confirmation message. You can then continue using the platform.
                </p>
              </div>
            )}

            {!isAuthenticated && !verified && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Sign in to request a new verification email.
              </div>
            )}
          </AuthCard>
        </div>
      </div>
    </main>
  )
}
