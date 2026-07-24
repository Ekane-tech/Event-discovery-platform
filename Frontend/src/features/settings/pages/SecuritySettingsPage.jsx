import { useState } from 'react'
import { toast } from 'sonner'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { authService } from '../../auth/services/authService.js'
import { getApiErrorMessage } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function SecuritySettingsPage() {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  function updateField(event) {
    setSaved(false)
    setError('')
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.newPassword.length < 8) return setError(t('auth.passwordMinLength', 'Password must be at least 8 characters.'))
    if (!/[a-zA-Z]/.test(form.newPassword)) return setError(t('auth.passwordLetter', 'Password must contain at least one letter.'))
    if (!/\d/.test(form.newPassword)) return setError(t('auth.passwordNumber', 'Password must contain at least one number.'))
    if (form.newPassword !== form.confirmPassword) return setError(t('auth.passwordsNotMatch', 'Passwords do not match.'))

    setSubmitting(true)
    try {
      await authService.changePassword({
        current_password: form.currentPassword,
        password: form.newPassword,
        password_confirmation: form.confirmPassword,
      })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSaved(true)
      toast.success(t('settings.security.updated', 'Password updated successfully.'))
    } catch (changeError) {
      const message = getApiErrorMessage(changeError, t('settings.security.updateError', 'Unable to update password.'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const tips = [
    t('settings.security.tip1', 'Use a unique password for this platform.'),
    t('settings.security.tip2', 'Use at least 8 characters with letters and numbers.'),
    t('settings.security.tip3', 'Do not share your login details with anyone.'),
    t('settings.security.tip4', 'Sign out from shared devices after use.'),
  ]

  return (
    <PageContainer>
      <section className="rounded-3xl bg-slate-950 p-8 text-white">
        <ShieldCheck className="h-10 w-10 text-teal-300" />
        <h1 className="mt-5 text-4xl font-black">{t('settings.securityTitle', 'Security settings')}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{t('settings.securityDescription')}</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950"><LockKeyhole className="h-5 w-5 text-teal-700" /> {t('settings.security.changePassword', 'Change password')}</h2>
          {saved && <div className="mb-4"><Alert type="success">{t('settings.security.updated', 'Password updated successfully.')}</Alert></div>}
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <FormInput label={t('settings.security.currentPassword', 'Current password')} name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} required />
            <FormInput label={t('auth.newPassword', 'New password')} name="newPassword" type="password" value={form.newPassword} onChange={updateField} required />
            <FormInput label={t('settings.security.confirmNewPassword', 'Confirm new password')} name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required />
            <Button type="submit" disabled={submitting}>{submitting ? t('settings.security.updating', 'Updating...') : t('settings.security.updatePassword', 'Update Password')}</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-black text-slate-950">{t('settings.security.tipsTitle', 'Security tips')}</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            {tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </Card>
      </div>
    </PageContainer>
  )
}
