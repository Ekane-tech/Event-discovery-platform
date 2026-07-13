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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
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

    if (!email) return setError('Email is required. Use the reset link from your email or Laravel log.')
    if (!token) return setError('Reset token is required. Use the reset link from your email or Laravel log.')
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
      setError(getApiErrorMessage(resetError, 'Unable to reset password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      eyebrow="Secure reset"
      title="Reset password"
      description="Use the reset link sent by Laravel. The link must include email and token query parameters."
      footer={<Link className="font-bold text-teal-700" to="/login">Return to login</Link>}
    >
      {success && <div className="mb-5"><Alert type="success">Password reset successfully. You can now return to login.</Alert></div>}
      {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormInput label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <FormInput label="Reset token" name="token" value={token} onChange={(event) => setToken(event.target.value)} required />
        <FormInput label="New password" name="password" type="password" value={form.password} onChange={updateField} required />
        <FormInput label="Confirm password" name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} required />
        <PasswordChecklist password={form.password} confirmation={form.passwordConfirmation} />
        <Button type="submit" disabled={submitting} className="h-12 gap-2 bg-teal-700 hover:bg-teal-800">
          <KeyRound className="h-4 w-4" />
          {submitting ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </AuthCard>
  )
}
