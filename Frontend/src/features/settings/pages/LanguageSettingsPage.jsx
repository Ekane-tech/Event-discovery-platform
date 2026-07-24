import { useState } from 'react'
import { toast } from 'sonner'
import { Globe2 } from 'lucide-react'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Select from '../../../shared/components/ui/Select.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

export default function LanguageSettingsPage() {
  const { t } = useTranslation()
  const { user, updateUserProfile } = useAuth()
  const [language, setLanguage] = useState(user?.preferredLanguage || 'English')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSave() {
    setError('')
    setSubmitting(true)
    try {
      await updateUserProfile({ preferredLanguage: language })
      setSaved(true)
      toast.success(t('settings.savedLanguage', 'Language preference saved.'))
    } catch (e) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-teal-700 p-8 text-white">
        <Globe2 className="h-10 w-10 text-blue-100" />
        <h1 className="mt-5 text-4xl font-black">{t('settings.languageTitle', 'Language settings')}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{t('settings.languageDescription')}</p>
      </section>
      <Card className="mt-6 max-w-xl">
        {saved && <div className="mb-4"><Alert type="success">{t('settings.savedLanguage', 'Language preference saved.')}</Alert></div>}
        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t('settings.preferredLanguageLabel', 'Preferred language')}</span>
          <Select value={language} onChange={(e) => { setSaved(false); setLanguage(e.target.value) }}>
            <option>{t('english', 'English')}</option>
            <option>{t('french', 'French')}</option>
          </Select>
        </label>
        <Button className="mt-5" onClick={handleSave} disabled={submitting}>{submitting ? t('common.saving', 'Saving...') : t('settings.saveLanguage', 'Save Language')}</Button>
      </Card>
    </PageContainer>
  )
}
