import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { authService } from '../services/authService.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSent(false)
    setSubmitting(true)

    try {
      const response = await authService.forgotPassword({ email })
      setMessage(response.data.message || t('auth.safeResetMessage'))
      setSent(true)
    } catch (forgotError) {
      setError(getApiErrorMessage(forgotError, t('auth.invalidEmailMessage')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      eyebrow={t('auth.forgotPasswordTitle')}
      title={t('auth.forgotPasswordTitle')}
      description={t('auth.forgotPasswordDescription')}
      footer={<> <Link className="font-bold text-teal-700" to="/login">{t('auth.backToLogin')}</Link> {t('auth.or')} <Link className="font-bold text-teal-700" to="/register">{t('auth.createAccount')}</Link></>}
    >
      {sent && <div className="mb-5"><Alert type="success">{message}</Alert></div>}
      {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormInput label={t('auth.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        <Button type="submit" disabled={submitting} className="h-12 gap-2 bg-teal-700 hover:bg-teal-800">
          <MailCheck className="h-4 w-4" />
          {submitting ? t('auth.sending') : t('auth.sendResetLink')}
        </Button>
      </form>
    </AuthCard>
  )
}
