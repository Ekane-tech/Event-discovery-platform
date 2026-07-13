import { KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import PasswordChecklist from '../components/PasswordChecklist.jsx'
import { authService } from '../services/authService.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [form, setForm] = useState({ password: '', passwordConfirmation: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setEmail(searchParams.get('email') || '')
    setToken(searchParams.get('token') || '')
  }, [searchParams])

  function updateField(event) {
    setError('')
    setSuccess(false)
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (!email) return setError(t('auth.emailRequired'))
    if (!token) return setError(t('auth.resetTokenRequired'))
    if (form.password.length < 8) return setError(t('auth.passwordMinLength'))
    if (!/[a-zA-Z]/.test(form.password)) return setError(t('auth.passwordLetter'))
    if (!/\d/.test(form.password)) return setError(t('auth.passwordNumber'))
    if (form.password !== form.passwordConfirmation) return setError(t('auth.passwordsNotMatch'))

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
      setError(getApiErrorMessage(resetError, t('auth.resetFailure')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      eyebrow={t('auth.passwordResetTitle')}
      title={t('auth.passwordResetTitle')}
      description={t('auth.passwordResetDescription')}
      footer={<Link className="font-bold text-teal-700" to="/login">{t('auth.backToLogin')}</Link>}
    >
      {success && <div className="mb-5"><Alert type="success">{t('auth.resetPasswordSuccess')}</Alert></div>}
      {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormInput label={t('auth.email')} name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <FormInput label={t('auth.resetToken')} name="token" value={token} onChange={(event) => setToken(event.target.value)} required />
        <FormInput label={t('auth.newPassword')} name="password" type="password" value={form.password} onChange={updateField} required />
        <FormInput label={t('auth.confirmPassword')} name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} required />
        <PasswordChecklist password={form.password} confirmation={form.passwordConfirmation} />
        <Button type="submit" disabled={submitting} className="h-12 gap-2 bg-teal-700 hover:bg-teal-800">
          <KeyRound className="h-4 w-4" />
          {submitting ? t('auth.resetting') : t('auth.passwordResetTitle')}
        </Button>
      </form>
    </AuthCard>
  )
}
