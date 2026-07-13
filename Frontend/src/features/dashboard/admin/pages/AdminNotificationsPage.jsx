import { toast } from 'sonner'
import { Megaphone, Send, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import AdminHero from '../components/AdminHero.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
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

function AudienceBadge({ audience }) {
  const styles = { users: 'bg-teal-50 text-teal-700', organizers: 'bg-blue-50 text-blue-700', admins: 'bg-purple-50 text-purple-700', all: 'bg-pink-50 text-pink-700' }
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[audience] || styles.users}`}>{audience}</span>
}

export default function AdminNotificationsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState({ title: '', message: '', audience: 'users', status: 'draft' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchAnnouncements() {
    setLoading(true); setError('')
    try { const response = await adminService.getAnnouncements({ per_page: 50 }); setAnnouncements(extractCollection(response.data, 'announcements')) }
    catch (fetchError) { setError(getApiErrorMessage(fetchError, 'Unable to load announcements.')) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAnnouncements() }, [])
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function handleSubmit(event) { event.preventDefault(); setSaving(true); setError(''); setSuccess(''); try { const response = await adminService.createAnnouncement(form); setSuccess(response.data.message || 'Announcement saved successfully.'); toast.success(response.data.message || 'Announcement saved successfully.'); setForm({ title: '', message: '', audience: 'users', status: 'draft' }); await fetchAnnouncements() } catch (saveError) { const m=getApiErrorMessage(saveError, 'Unable to save announcement.'); setError(m); toast.error(m) } finally { setSaving(false) } }
  async function sendAnnouncement(announcementId) { setSaving(true); setError(''); setSuccess(''); try { const response = await adminService.sendAnnouncement(announcementId); setSuccess(response.data.message || 'Announcement sent successfully.'); toast.success(response.data.message || 'Announcement sent successfully.'); await fetchAnnouncements() } catch (sendError) { const m=getApiErrorMessage(sendError, 'Unable to send announcement.'); setError(m); toast.error(m) } finally { setSaving(false) } }

  const counts = useMemo(() => ({ total: announcements.length, drafts: announcements.filter(a=>a.status==='draft').length, sent: announcements.filter(a=>a.status==='sent').length }), [announcements])

  return <PageContainer><AdminHero title="Announcements" description="Create announcements and send system notifications to selected audiences." />{error&&<div className="mt-6"><Alert type="error">{error}</Alert></div>}{success&&<div className="mt-6"><Alert type="success">{success}</Alert></div>}<div className="mt-6 grid gap-4 md:grid-cols-3"><Card><Megaphone className="h-5 w-5 text-teal-700"/><p className="mt-3 text-3xl font-black">{counts.total}</p><p className="text-sm text-slate-600">Total announcements</p></Card><Card><Users className="h-5 w-5 text-amber-700"/><p className="mt-3 text-3xl font-black">{counts.drafts}</p><p className="text-sm text-slate-600">Drafts</p></Card><Card><Send className="h-5 w-5 text-blue-700"/><p className="mt-3 text-3xl font-black">{counts.sent}</p><p className="text-sm text-slate-600">Sent</p></Card></div><Card className="my-6"><form onSubmit={handleSubmit} className="grid gap-4"><FormInput label="Title" name="title" value={form.title} onChange={updateField} placeholder="Announcement title" required/><FormTextarea label="Message" name="message" value={form.message} onChange={updateField} placeholder="Notification message" rows="4" required/><div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Audience</span><Select name="audience" value={form.audience} onChange={updateField}><option value="users">Registered users</option><option value="organizers">Organizers</option><option value="admins">Administrators</option><option value="all">Everyone</option></Select></label><label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Action</span><Select name="status" value={form.status} onChange={updateField}><option value="draft">Save as draft</option><option value="sent">Send immediately</option></Select></label></div><div className="flex justify-end"><Button type="submit" disabled={saving}>{saving?'Saving...':'Save Announcement'}</Button></div></form></Card>{loading&&<Loader message="Loading announcements..."/>}{!loading&&error&&announcements.length===0&&<ErrorState title="Unable to load announcements" message={error}/>}<div className="grid gap-4 md:grid-cols-2">{announcements.map(a=><Card key={a.id} className="border-l-4 border-l-teal-600"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-3 flex flex-wrap gap-2"><AdminStatusBadge status={a.status}/><AudienceBadge audience={a.audience}/></div><h2 className="text-xl font-black text-slate-950">{a.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{a.message}</p><p className="mt-3 text-xs text-slate-500">Created {formatDate(a.created_at)}{a.sent_at?` • Sent ${formatDate(a.sent_at)}`:''}</p></div>{a.status!=='sent'&&<Button variant="secondary" disabled={saving} onClick={()=>sendAnnouncement(a.id)}><Send className="mr-2 h-4 w-4"/>Send</Button>}</div></Card>)}</div></PageContainer>
}
