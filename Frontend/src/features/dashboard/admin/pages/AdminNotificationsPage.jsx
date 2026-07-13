import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import FormInput from '../../../../shared/components/forms/FormInput.jsx'
import FormTextarea from '../../../../shared/components/forms/FormTextarea.jsx'
import { formatDate } from '../../../../shared/utils/formatDate.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminNotificationsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState({ title: '', message: '', audience: 'users', status: 'draft' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchAnnouncements() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getAnnouncements({ per_page: 50 })
      setAnnouncements(extractCollection(response.data, 'announcements'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load announcements.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
      toast.success('')

    try {
      const response = await adminService.createAnnouncement(form)
      setSuccess(response.data.message || 'Announcement saved successfully.')
      toast.success(response.data.message || 'Saved successfully.')
      setForm({ title: '', message: '', audience: 'users', status: 'draft' })
      await fetchAnnouncements()
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Unable to save announcement.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function sendAnnouncement(announcementId) {
    setSaving(true)
    setError('')
    setSuccess('')
      toast.success('')
    try {
      const response = await adminService.sendAnnouncement(announcementId)
      setSuccess(response.data.message || 'Announcement sent successfully.')
      toast.success(response.data.message || 'Saved successfully.')
      await fetchAnnouncements()
    } catch (sendError) {
      setError(getApiErrorMessage(sendError, 'Unable to send announcement.'))
      toast.error('Action failed. Please review the form and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer>
      <SectionHeader title="Manage Notifications" description="Create announcements and send system notifications to selected audiences." />

      {error && <div className="mb-6"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-6"><Alert type="success">{success}</Alert></div>}

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <FormInput label="Title" name="title" value={form.title} onChange={updateField} placeholder="Announcement title" required />
          <FormTextarea label="Message" name="message" value={form.message} onChange={updateField} placeholder="Notification message" rows="4" required />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Audience</span>
              <Select name="audience" value={form.audience} onChange={updateField}>
                <option value="users">Registered users</option>
                <option value="organizers">Organizers</option>
                <option value="admins">Administrators</option>
                <option value="all">Everyone</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Action</span>
              <Select name="status" value={form.status} onChange={updateField}>
                <option value="draft">Save as draft</option>
                <option value="sent">Send immediately</option>
              </Select>
            </label>
          </div>
          <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Announcement'}</Button></div>
        </form>
      </Card>

      {loading && <Loader message="Loading announcements..." />}
      {!loading && error && announcements.length === 0 && <ErrorState title="Unable to load announcements" message={error} />}

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <AdminStatusBadge status={announcement.status} />
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{announcement.audience}</span>
                </div>
                <h2 className="font-bold text-slate-950">{announcement.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{announcement.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Created {formatDate(announcement.created_at)}{announcement.sent_at ? ` • Sent ${formatDate(announcement.sent_at)}` : ''}
                </p>
              </div>
              {announcement.status !== 'sent' && <Button variant="secondary" disabled={saving} onClick={() => sendAnnouncement(announcement.id)}>Send</Button>}
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
