import { toast } from 'sonner'
import { Building2, Camera, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../../../shared/components/feedback/Alert.jsx'
import Loader from '../../../shared/components/feedback/Loader.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import Card from '../../../shared/components/ui/Card.jsx'
import Avatar from '../../../shared/components/ui/Avatar.jsx'
import FormInput from '../../../shared/components/forms/FormInput.jsx'
import FormSelect from '../../../shared/components/forms/FormSelect.jsx'
import FormTextarea from '../../../shared/components/forms/FormTextarea.jsx'
import PageContainer from '../../../shared/components/layout/PageContainer.jsx'
import { CAMEROON_REGIONS } from '../../../shared/constants/regions.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useProfileApi } from '../hooks/useProfileApi.js'
import { profileService } from '../services/profileService.js'
import { normalizeAuthUser } from '../../auth/utils/normalizeAuthUser.js'
import { useTranslation } from '../../../shared/i18n/useTranslation.js'

function getEditCopy(role, t) {
  if (role === 'admin') {
    return {
      title: t('profile.edit.adminTitle', 'Edit administrator profile'),
      description: t('profile.edit.adminDescription', 'Keep your administrator identity, contact information and internal profile note up to date.'),
      badge: t('profile.edit.adminBadge', 'System profile'),
    }
  }

  if (role === 'organizer') {
    return {
      title: t('profile.edit.organizerTitle', 'Edit organizer profile'),
      description: t('profile.edit.organizerDescription', 'Update your organizer identity and public-facing profile information for attendees.'),
      badge: t('profile.edit.organizerBadge', 'Organizer identity'),
    }
  }

  return {
    title: t('profile.edit.title', 'Edit profile'),
    description: t('profile.edit.description', 'Update your personal information, profile photo, and preferences.'),
    badge: t('profile.edit.badge', 'Account profile'),
  }
}

export default function EditProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updateUserProfile } = useAuth()
  const { profile, loading, error: loadError } = useProfileApi()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [preview, setPreview] = useState('')
  const [form, setForm] = useState({ name: '', organizationName: '', phone: '', city: '', region: 'Littoral', preferredLanguage: 'English', avatar: '', avatarFile: null, bio: '' })

  const role = String(profile?.role || 'user').toLowerCase()
  const copy = getEditCopy(role, t)

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        organizationName: profile.organizationName || '',
        phone: profile.phone || '',
        city: profile.city || '',
        region: profile.region || 'Littoral',
        preferredLanguage: profile.preferredLanguage || 'English',
        avatar: profile.avatar || '',
        avatarFile: null,
        bio: profile.bio || '',
      })
      setPreview(profile.avatar || '')
    }
  }, [profile])

  function updateField(event) {
    setError('')
    const { name, value, files, type } = event.target
    if (type === 'file') {
      const file = files?.[0] || null
      setForm((current) => ({ ...current, [name]: file }))
      setPreview(file ? URL.createObjectURL(file) : form.avatar)
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function removeAvatar() {
    setRemovingAvatar(true)
    setError('')
    try {
      const response = await profileService.removeAvatar()
      await updateUserProfile(normalizeAuthUser(response.data.profile))
      setPreview('')
      setForm((current) => ({ ...current, avatar: '', avatarFile: null }))
      toast.success(t('profile.edit.photoRemoved', 'Profile photo removed.'))
    } catch (removeError) {
      const message = removeError.message || t('profile.edit.removePhotoError', 'Unable to remove profile photo.')
      setError(message)
      toast.error(message)
    } finally {
      setRemovingAvatar(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await updateUserProfile(form)
      if (form.avatarFile) {
        const formData = new FormData()
        formData.append('avatar', form.avatarFile)
        const response = await profileService.uploadAvatar(formData)
        await updateUserProfile(normalizeAuthUser(response.data.profile))
      }
      toast.success(t('profile.edit.updated', 'Profile updated successfully.'))
      navigate('/profile')
    } catch (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageContainer><Loader message={t('profile.edit.loading', 'Loading profile form...')} /></PageContainer>

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-slate-950 p-8 text-white">
        <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-teal-100">{copy.badge}</span>
        <h1 className="mt-5 text-4xl font-black">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{copy.description}</p>
      </section>

      <Card className="mt-6">
        <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar name={form.name} src={preview} className="h-24 w-24 text-3xl" />
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-950">{t('profile.edit.photoTitle', 'Profile photo')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('profile.edit.photoHint', 'Use a clear photo or logo for a stronger Mboa profile presence.')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                <Camera className="h-4 w-4" /> {t('profile.edit.uploadPhoto', 'Upload photo')}
                <input name="avatarFile" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={updateField} className="hidden" />
              </label>
              {(preview || form.avatarFile) && <Button type="button" variant="danger" onClick={removeAvatar} disabled={removingAvatar}><Trash2 className="mr-2 h-4 w-4" />{removingAvatar ? t('profile.edit.removing', 'Removing...') : t('profile.edit.removePhoto', 'Remove photo')}</Button>}
            </div>
          </div>
          {form.avatarFile && <span className="text-sm text-slate-500">{form.avatarFile.name}</span>}
        </div>

        {loadError && <div className="mb-5"><Alert type="error">{loadError}</Alert></div>}
        {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label={role === 'admin' ? t('profile.edit.adminName', 'Administrator name') : t('profile.edit.fullName', 'Full name')} name="name" value={form.name} onChange={updateField} required />
            {role === 'organizer' && <FormInput label={t('profile.organizerName', 'Organizer name')} name="organizationName" value={form.organizationName} onChange={updateField} placeholder={t('profile.edit.organizerNamePlaceholder', 'Company, brand or organizer name')} />}
            {role === 'admin' && <div className="rounded-2xl bg-slate-50 p-4"><ShieldCheck className="h-5 w-5 text-teal-700" /><p className="mt-2 text-sm font-bold text-slate-950">{t('profile.edit.adminAccessTitle', 'Administrator access')}</p><p className="mt-1 text-xs text-slate-500">{t('profile.edit.adminAccessText', 'Role changes are managed from the admin users page.')}</p></div>}
            {role === 'organizer' && <div className="rounded-2xl bg-teal-50 p-4"><Building2 className="h-5 w-5 text-teal-700" /><p className="mt-2 text-sm font-bold text-slate-950">{t('profile.edit.organizerBrandTitle', 'Organizer brand')}</p><p className="mt-1 text-xs text-slate-600">{t('profile.edit.organizerBrandText', 'This name helps identify your events and communications.')}</p></div>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label={t('profile.phone', 'Phone')} name="phone" value={form.phone} onChange={updateField} placeholder={t('profile.edit.phonePlaceholder', '+237 6XX XXX XXX')} />
            <FormInput label={t('profile.city', 'City')} name="city" value={form.city} onChange={updateField} placeholder={t('profile.edit.cityPlaceholder', 'Douala')} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect label={t('profile.region', 'Region')} name="region" value={form.region} onChange={updateField}>{CAMEROON_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}</FormSelect>
            <FormSelect label={t('profile.preferredLanguage', 'Preferred language')} name="preferredLanguage" value={form.preferredLanguage} onChange={updateField}><option>{t('english', 'English')}</option><option>{t('french', 'French')}</option></FormSelect>
          </div>

          <FormTextarea label={role === 'organizer' ? t('profile.organizerBio', 'Organizer bio') : role === 'admin' ? t('profile.adminNote', 'Administrative note') : t('profile.bio', 'Bio')} name="bio" value={form.bio} onChange={updateField} rows="5" placeholder={role === 'organizer' ? t('profile.edit.organizerBioPlaceholder', 'Tell attendees about your organizer brand.') : role === 'admin' ? t('profile.edit.adminNotePlaceholder', 'Add a short note about your role.') : t('profile.edit.bioPlaceholder', 'Tell people about yourself.')} />

          <div className="flex justify-end"><Button type="submit" disabled={submitting}><Save className="mr-2 h-4 w-4" />{submitting ? t('profile.edit.saving', 'Saving...') : t('profile.edit.saveProfile', 'Save Profile')}</Button></div>
        </form>
      </Card>
    </PageContainer>
  )
}
