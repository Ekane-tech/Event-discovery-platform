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

export default function SecuritySettingsPage() {
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

    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.')
    if (!/[a-zA-Z]/.test(form.newPassword)) return setError('New password must contain at least one letter.')
    if (!/\d/.test(form.newPassword)) return setError('New password must contain at least one number.')
    if (form.newPassword !== form.confirmPassword) return setError('New password and confirmation do not match.')

    setSubmitting(true)
    try {
      await authService.changePassword({
        current_password: form.currentPassword,
        password: form.newPassword,
        password_confirmation: form.confirmPassword,
      })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSaved(true)
      toast.success('Password updated successfully.')
    } catch (changeError) {
      const message = getApiErrorMessage(changeError, 'Unable to update password.')
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <section className="rounded-3xl bg-slate-950 p-8 text-white">
        <ShieldCheck className="h-10 w-10 text-teal-300" />
        <h1 className="mt-5 text-4xl font-black">Security settings</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Update your password and keep your account protected.</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950"><LockKeyhole className="h-5 w-5 text-teal-700" /> Change password</h2>
          {saved && <div className="mb-4"><Alert type="success">Password updated successfully.</Alert></div>}
          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <FormInput label="Current password" name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} required />
            <FormInput label="New password" name="newPassword" type="password" value={form.newPassword} onChange={updateField} required />
            <FormInput label="Confirm new password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required />
            <Button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Update Password'}</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-black text-slate-950">Security tips</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <li>Use a unique password for this platform.</li>
            <li>Use at least 8 characters with letters and numbers.</li>
            <li>Do not share your login details with anyone.</li>
            <li>Sign out from shared devices after use.</li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  )
}
