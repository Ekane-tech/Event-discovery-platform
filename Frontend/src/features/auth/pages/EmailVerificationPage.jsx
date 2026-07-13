import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import AuthCard from '../components/AuthCard.jsx'

export default function EmailVerificationPage() {
  const [resent, setResent] = useState(false)

  function resendEmail() {
    localStorage.setItem('mock_verification_email_sent_at', new Date().toISOString())
    setResent(true)
  }

  return (
    <AuthCard
      eyebrow="Verify account"
      title="Verify your email"
      description="Please check your inbox and click the verification link. In mock mode, you can simulate resending the email."
      footer={<Link className="font-bold text-teal-700" to="/login">Back to login</Link>}
    >
      {resent && <div className="mb-5"><Alert type="success">Verification email resent in mock mode.</Alert></div>}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
          <MailCheck className="h-10 w-10" />
        </div>
      </div>
      <Button className="mt-6 h-12 w-full bg-teal-700 hover:bg-teal-800" type="button" onClick={resendEmail}>Resend verification email</Button>
    </AuthCard>
  )
}