import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { authService } from '../services/authService.js'
import { useAuth } from '../hooks/useAuth.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'

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

  useEffect(() => {
    if (status === 'verified') {
      setMessage('Email verified successfully. Your account is now confirmed.')
      if (isAuthenticated) refreshUser().catch(() => {})
      return
    }

    if (status === 'required') {
      setError('Please verify your email address before continuing.')
      return
    }

    if (status === 'sent') {
      setMessage('We sent a verification email. Please check your inbox to continue.')
    }
  }, [status, isAuthenticated, refreshUser])

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
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-teal-100 via-white to-pink-100" />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-teal-900 p-8 text-white shadow-2xl shadow-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-teal-100">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-black leading-tight">Confirm your email to continue.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            Email verification protects your account and confirms that important event, ticket and payment messages reach you.
          </p>
          <div className="mt-6 rounded-3xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-100">Verification email sent to</p>
            <p className="mt-2 text-lg font-black">{maskedEmail}</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-xl">
          <AuthCard
            eyebrow="Email verification"
            title={verified ? 'Email verified' : 'Check your inbox'}
            description={verified ? 'Your email address has been confirmed.' : 'Open the email we sent and click the verification button. If you do not see it, check spam or request a new email.'}
            footer={<><Link className="font-bold text-teal-700" to="/login">Back to login</Link>{verified && <> or <Link className="font-bold text-teal-700" to="/dashboard">continue</Link></>}</>}
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
                  {sending ? 'Sending...' : 'Resend verification email'}
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
