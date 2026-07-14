import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react'
import AdminHero from '../components/AdminHero.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Avatar from '../../../../shared/components/ui/Avatar.jsx'
import Modal from '../../../../shared/components/ui/Modal.jsx'
import Textarea from '../../../../shared/components/ui/Textarea.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import Alert from '../../../../shared/components/feedback/Alert.jsx'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import { useAuth } from '../../../auth/hooks/useAuth.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

function RoleBadge({ role }) {
  const styles = { admin: 'bg-purple-100 text-purple-800', organizer: 'bg-blue-100 text-blue-800', user: 'bg-teal-100 text-teal-800' }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[role] || 'bg-slate-100 text-slate-700'}`}>{role || 'unknown'}</span>
}
function UserMetric({ label, value, icon: Icon, gradient }) { return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15"/><Icon className="relative h-6 w-6"/><p className="relative mt-3 text-3xl font-black">{value}</p><p className="relative text-sm text-white/85">{label}</p></div> }

const SUSPENSION_REASONS = [
  'Violation of platform terms',
  'Suspicious or fraudulent activity',
  'Inappropriate event content',
  'Payment or ticketing abuse',
  'Repeated reports from users',
  'Account verification issue',
  'Other',
]

const ACTIVATION_REASONS = [
  'Account review completed',
  'Issue resolved',
  'Identity verified',
  'Suspension lifted after appeal',
  'Administrative correction',
  'Other',
]

function buildStatusReason(status, selectedReason, details) {
  const detailText = String(details || '').trim()
  if (!selectedReason) return detailText
  if (selectedReason === 'Other') return detailText
  return detailText ? `${selectedReason}: ${detailText}` : selectedReason
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ keyword: '', role: 'all', status: 'all' })
  const [statusModal, setStatusModal] = useState({ open: false, user: null, status: '', selectedReason: '', details: '' })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  function buildParams() { const params = { per_page: 50 }; if (filters.keyword.trim()) params.keyword = filters.keyword.trim(); if (filters.role !== 'all') params.role = filters.role; if (filters.status !== 'all') params.status = filters.status; return params }
  async function fetchUsers() { setLoading(true); setError(''); try { const response = await adminService.getUsers(buildParams()); setUsers(extractCollection(response.data, 'users')) } catch (fetchError) { setError(getApiErrorMessage(fetchError, 'Unable to load users.')) } finally { setLoading(false) } }
  useEffect(() => { fetchUsers() }, [])
  function updateFilter(event) { setFilters((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function resetFilters() { setFilters({ keyword: '', role: 'all', status: 'all' }); setTimeout(fetchUsers, 0) }

  function openStatusModal(targetUser, status) {
    setStatusModal({ open: true, user: targetUser, status, selectedReason: '', details: '' })
  }
  function closeStatusModal() { setStatusModal({ open: false, user: null, status: '', selectedReason: '', details: '' }) }
  async function submitStatusUpdate(event) {
    event.preventDefault()
    const reason = buildStatusReason(statusModal.status, statusModal.selectedReason, statusModal.details)
    if (!statusModal.selectedReason) return toast.error('Please choose a reason.')
    if (statusModal.selectedReason === 'Other' && !statusModal.details.trim()) return toast.error('Please describe the reason.')
    if (statusModal.status === 'suspended' && !reason.trim()) return toast.error('Please provide a suspension reason.')
    setActionLoading(true)
    try {
      await adminService.updateUserStatus(statusModal.user.id, statusModal.status, reason)
      toast.success(`User ${statusModal.status === 'suspended' ? 'suspended' : 'activated'} successfully.`)
      closeStatusModal()
      await fetchUsers()
    } catch (statusError) { toast.error(getApiErrorMessage(statusError, 'Unable to update user status.')) } finally { setActionLoading(false) }
  }
  async function updateRole(userId, role) { setActionLoading(true); try { await adminService.updateUserRole(userId, role); toast.success('User role updated successfully.'); await fetchUsers() } catch (roleError) { toast.error(getApiErrorMessage(roleError, 'Unable to update user role.')) } finally { setActionLoading(false) } }

  const metrics = useMemo(() => ({ total: users.length, active: users.filter((user) => user.status === 'active').length, suspended: users.filter((user) => user.status === 'suspended').length, organizers: users.filter((user) => user.role?.name === 'organizer').length }), [users])
  const rows = users.map((user) => {
    const isSelf = Number(currentUser?.id) === Number(user.id)
    return {
      id: user.id,
      user: <div className="flex items-center gap-3"><Avatar name={user.name} src={user.profile?.avatar}/><div><p className="font-bold text-slate-950">{user.name}{isSelf && <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">You</span>}</p><p className="text-xs text-slate-500">#{user.id}</p></div></div>,
      email: <span className="text-slate-600">{user.email}</span>,
      role: <RoleBadge role={user.role?.name} />,
      location: <span className="text-slate-600">{user.profile?.city || '—'}{user.profile?.region ? `, ${user.profile.region}` : ''}</span>,
      status: <AdminStatusBadge status={user.status} />,
      joined: <span className="text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>,
      actions: isSelf ? <span className="text-xs font-semibold text-slate-400">Own status protected</span> : <AdminPageActions>{user.status !== 'active' && <AdminActionButton disabled={actionLoading} onClick={() => openStatusModal(user, 'active')}>Activate</AdminActionButton>}{user.status !== 'suspended' && <AdminActionButton disabled={actionLoading} onClick={() => openStatusModal(user, 'suspended')}>Suspend</AdminActionButton>}{user.role?.name !== 'user' && <AdminActionButton disabled={actionLoading} onClick={() => updateRole(user.id, 'user')}>Make User</AdminActionButton>}{user.role?.name !== 'organizer' && <AdminActionButton disabled={actionLoading} onClick={() => updateRole(user.id, 'organizer')}>Make Organizer</AdminActionButton>}</AdminPageActions>,
    }
  })

  return <PageContainer><AdminHero title="Manage users" description="Review accounts, roles and access status across the platform." />
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><UserMetric label="Total users" value={metrics.total} icon={Users} gradient="from-indigo-600 to-blue-700"/><UserMetric label="Active" value={metrics.active} icon={UserCheck} gradient="from-teal-600 to-emerald-700"/><UserMetric label="Suspended" value={metrics.suspended} icon={UserX} gradient="from-rose-600 to-pink-700"/><UserMetric label="Organizers" value={metrics.organizers} icon={ShieldCheck} gradient="from-amber-500 to-orange-700"/></div>
    <Card className="my-6"><div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Search by name or email" className="pl-10"/></div><Select name="role" value={filters.role} onChange={updateFilter}><option value="all">All roles</option><option value="user">Users</option><option value="organizer">Organizers</option><option value="admin">Admins</option></Select><Select name="status" value={filters.status} onChange={updateFilter}><option value="all">All statuses</option><option value="active">Active</option><option value="pending_approval">Pending approval</option><option value="suspended">Suspended</option></Select><Button type="button" onClick={fetchUsers}>Search</Button><Button type="button" variant="secondary" onClick={resetFilters}>Reset</Button></div></Card>
    {loading && <Loader message="Loading users..."/>}{error && <ErrorState title="Unable to load users" message={error}/>} {!loading && !error && <Table columns={[{key:'user',label:'User'},{key:'email',label:'Email'},{key:'role',label:'Role'},{key:'location',label:'Location'},{key:'status',label:'Status'},{key:'joined',label:'Joined'},{key:'actions',label:'Actions'}]} rows={rows}/>} 
    <Modal open={statusModal.open} title={statusModal.status === 'suspended' ? 'Suspend account' : 'Activate account'} onClose={closeStatusModal}>
      <form onSubmit={submitStatusUpdate} className="grid gap-4">
        <Alert type={statusModal.status === 'suspended' ? 'warning' : 'info'}>{statusModal.status === 'suspended' ? `This will disable ${statusModal.user?.name}'s access and send an email notification with the reason.` : `This will reactivate ${statusModal.user?.name}'s access and send an email notification.`}</Alert>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Reason sent by email</span>
          <Select value={statusModal.selectedReason} onChange={(event) => setStatusModal((current) => ({ ...current, selectedReason: event.target.value }))} required>
            <option value="">Choose a reason</option>
            {(statusModal.status === 'suspended' ? SUSPENSION_REASONS : ACTIVATION_REASONS).map((reason) => <option key={reason} value={reason}>{reason}</option>)}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Additional details {statusModal.selectedReason === 'Other' ? '(required)' : '(optional)'}</span>
          <Textarea value={statusModal.details} onChange={(event) => setStatusModal((current) => ({ ...current, details: event.target.value }))} rows="4" placeholder={statusModal.status === 'suspended' ? 'Add details that will help the user understand the suspension.' : 'Add a short note for the user if needed.'} required={statusModal.selectedReason === 'Other'} />
        </label>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeStatusModal}>Cancel</Button><Button type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : statusModal.status === 'suspended' ? 'Suspend account' : 'Activate account'}</Button></div>
      </form>
    </Modal>
  </PageContainer>
}
