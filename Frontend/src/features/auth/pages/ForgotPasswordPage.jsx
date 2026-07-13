import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { authService } from '../services/authService.js'
import { getApiErrorMessage } from '../utils/normalizeAuthUser.js'

const SAFE_RESET_MESSAGE = 'If an account exists for this email, a password reset link has been sent.'

export default function ForgotPasswordPage() {
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
      setMessage(response.data.message || SAFE_RESET_MESSAGE)
      setSent(true)
    } catch (forgotError) {
      // Syntax/validation errors like invalid email format can be shown.
      // Unknown-account errors are not exposed by the production-safe backend.
      setError(getApiErrorMessage(forgotError, 'Please enter a valid email address and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      eyebrow="Password recovery"
      title="Forgot your password?"
      description="Enter your email address. If an account exists, we will send password reset instructions."
      footer={<><Link className="font-bold text-teal-700" to="/login">Back to login</Link> or <Link className="font-bold text-teal-700" to="/register">create an account</Link></>}
    >
      {sent && <div className="mb-5"><Alert type="success">{message}</Alert></div>}
      {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormInput label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        <Button type="submit" disabled={submitting} className="h-12 gap-2 bg-teal-700 hover:bg-teal-800">
          <MailCheck className="h-4 w-4" />
          {submitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  )
}
