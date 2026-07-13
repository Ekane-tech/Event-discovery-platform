import { toast } from 'sonner'
import { Camera, Save, Trash2 } from 'lucide-react'
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

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { updateUserProfile } = useAuth()
  const { profile, loading, error: loadError } = useProfileApi()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [preview, setPreview] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', city: '', region: 'Littoral', preferredLanguage: 'English', avatar: '', avatarFile: null, bio: '' })

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '', region: profile.region || 'Littoral', preferredLanguage: profile.preferredLanguage || 'English', avatar: profile.avatar || '', avatarFile: null, bio: profile.bio || '' })
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
      toast.success('Profile photo removed.')
    } catch (removeError) {
      const message = removeError.message || 'Unable to remove profile photo.'
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
      toast.success('Profile updated successfully.')
      navigate('/profile')
    } catch (updateError) {
      toast.error(updateError.message)
      setError(updateError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageContainer><Loader message="Loading profile form..." /></PageContainer>

  return (
    <PageContainer>
      <section className="rounded-3xl bg-gradient-to-r from-teal-700 to-slate-950 p-8 text-white">
        <h1 className="text-4xl font-black">Edit profile</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Update your personal information, profile photo, and preferences.</p>
      </section>
      <Card className="mt-6">
        <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar name={form.name} src={preview} className="h-20 w-20 text-2xl" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700">
              <Camera className="h-4 w-4" /> Upload photo
              <input name="avatarFile" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={updateField} className="hidden" />
            </label>
            {(preview || form.avatarFile) && <Button type="button" variant="danger" onClick={removeAvatar} disabled={removingAvatar}><Trash2 className="mr-2 h-4 w-4" />{removingAvatar ? 'Removing...' : 'Remove photo'}</Button>}
          </div>
          {form.avatarFile && <span className="text-sm text-slate-500">{form.avatarFile.name}</span>}
        </div>
        {loadError && <div className="mb-5"><Alert type="error">{loadError}</Alert></div>}
        {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <FormInput label="Name" name="name" value={form.name} onChange={updateField} required />
          <FormInput label="Phone" name="phone" value={form.phone} onChange={updateField} placeholder="+237 6XX XXX XXX" />
          <div className="grid gap-4 md:grid-cols-2"><FormInput label="City" name="city" value={form.city} onChange={updateField} placeholder="Douala" /><FormSelect label="Region" name="region" value={form.region} onChange={updateField}>{CAMEROON_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</FormSelect></div>
          <FormSelect label="Preferred language" name="preferredLanguage" value={form.preferredLanguage} onChange={updateField}><option>English</option><option>French</option></FormSelect>
          <FormTextarea label="Bio" name="bio" value={form.bio} onChange={updateField} rows="5" placeholder="Tell people about yourself" />
          <div className="flex justify-end"><Button type="submit" disabled={submitting}><Save className="mr-2 h-4 w-4" />{submitting ? 'Saving...' : 'Save Profile'}</Button></div>
        </form>
      </Card>
    </PageContainer>
  )
}
