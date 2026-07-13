import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import AuthCard from '../components/AuthCard.jsx'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function EmailVerificationPage() {
  const { t } = useTranslation()
  const [resent, setResent] = useState(false)

  function resendEmail() {
    localStorage.setItem('mock_verification_email_sent_at', new Date().toISOString())
    setResent(true)
  }

  return (
    <AuthCard
      eyebrow={t('auth.verifyAccount')}
      title={t('auth.verifyEmailTitle')}
      description={t('auth.verifyEmailDescription')}
      footer={<Link className="font-bold text-teal-700" to="/login">{t('auth.backToLogin')}</Link>}
    >
      {resent && <div className="mb-5"><Alert type="success">{t('auth.verificationEmailResent')}</Alert></div>}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
          <MailCheck className="h-10 w-10" />
        </div>
      </div>
      <Button className="mt-6 h-12 w-full bg-teal-700 hover:bg-teal-800" type="button" onClick={resendEmail}>{t('auth.resendVerificationEmail')}</Button>
    </AuthCard>
  )
}
