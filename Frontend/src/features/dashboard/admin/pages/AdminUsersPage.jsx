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
import { useTranslation } from '../../../../shared/i18n/useTranslation.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

function RoleBadge({ role, t }) {
  const styles = { admin: 'bg-purple-100 text-purple-800', organizer: 'bg-blue-100 text-blue-800', user: 'bg-teal-100 text-teal-800' }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[role] || 'bg-slate-100 text-slate-700'}`}>{t(`admin.common.${role}`, role || 'unknown')}</span>
}
function UserMetric({ label, value, icon: Icon, gradient, t }) { return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15"/><Icon className="relative h-6 w-6"/><p className="relative mt-3 text-2xl font-black md:text-3xl">{value}</p><p className="relative text-sm text-white/85">{label}</p></div> }

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
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ keyword: '', role: 'all', status: 'all' })
  const [statusModal, setStatusModal] = useState({ open: false, user: null, status: '', selectedReason: '', details: '' })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  function buildParams() { const params = { per_page: 50 }; if (filters.keyword.trim()) params.keyword = filters.keyword.trim(); if (filters.role !== 'all') params.role = filters.role; if (filters.status !== 'all') params.status = filters.status; return params }
  async function fetchUsers() { setLoading(true); setError(''); try { const response = await adminService.getUsers(buildParams()); setUsers(extractCollection(response.data, 'users')) } catch (fetchError) { setError(getApiErrorMessage(fetchError, t('admin.users.toasts.error.load', 'Unable to load users.'))) } finally { setLoading(false) } }
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
    if (!statusModal.selectedReason) return toast.error(t('admin.users.toasts.error.chooseReason', 'Please choose a reason.'))
    if (statusModal.selectedReason === 'Other' && !statusModal.details.trim()) return toast.error(t('admin.users.toasts.error.describeReason', 'Please describe the reason.'))
    if (statusModal.status === 'suspended' && !reason.trim()) return toast.error(t('admin.users.toasts.error.describeReason', 'Please provide a suspension reason.'))
    setActionLoading(true)
    try {
      await adminService.updateUserStatus(statusModal.user.id, statusModal.status, reason)
      toast.success(statusModal.status === 'suspended' ? t('admin.users.toasts.suspended', 'User suspended successfully.') : t('admin.users.toasts.activated', 'User activated successfully.'))
      closeStatusModal()
      await fetchUsers()
    } catch (statusError) { toast.error(getApiErrorMessage(statusError, t('admin.users.toasts.error.statusUpdate', 'Unable to update user status.'))) } finally { setActionLoading(false) }
  }
  async function toggleOrganizerVerification(targetUser) {
    setActionLoading(true)
    try {
      const nextValue = !Boolean(targetUser.profile?.is_verified_organizer)
      await adminService.updateOrganizerVerification(targetUser.id, nextValue)
      toast.success(nextValue ? t('admin.users.toasts.organizerVerified', 'Organizer verified successfully.') : t('admin.users.toasts.organizerUnverified', 'Organizer verification removed.'))
      await fetchUsers()
    } catch (verificationError) {
      toast.error(getApiErrorMessage(verificationError, t('admin.users.toasts.error.verification', 'Unable to update organizer verification.')))
    } finally {
      setActionLoading(false)
    }
  }

  async function updateRole(userId, role) { setActionLoading(true); try { await adminService.updateUserRole(userId, role); toast.success(t('admin.users.toasts.roleUpdated', 'User role updated successfully.')); await fetchUsers() } catch (roleError) { toast.error(getApiErrorMessage(roleError, t('admin.users.toasts.error.roleUpdate', 'Unable to update user role.'))) } finally { setActionLoading(false) } }

  const metrics = useMemo(() => ({ total: users.length, active: users.filter((user) => user.status === 'active').length, suspended: users.filter((user) => user.status === 'suspended').length, organizers: users.filter((user) => user.role?.name === 'organizer').length }), [users])
  const rows = users.map((user) => {
    const isSelf = Number(currentUser?.id) === Number(user.id)
    return {
      id: user.id,
      user: <div className="flex items-center gap-3"><Avatar name={user.name} src={user.profile?.avatar}/><div><p className="font-bold text-slate-950">{user.name}{isSelf && <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">{t('admin.common.yes', 'You')}</span>}</p><p className="text-xs text-slate-500">#{user.id}</p></div></div>,
      email: <span className="text-slate-600">{user.email}</span>,
      role: <div className="flex flex-wrap gap-1"><RoleBadge role={user.role?.name} t={t} />{user.role?.name === 'organizer' && user.profile?.is_verified_organizer && <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">{t('admin.common.verified', 'Verified')}</span>}</div>,
      location: <span className="text-slate-600">{user.profile?.city || '—'}{user.profile?.region ? `, ${user.profile.region}` : ''}</span>,
      status: <AdminStatusBadge status={user.status} />,
      joined: <span className="text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>,
      actions: isSelf ? <span className="text-xs font-semibold text-slate-400">{t('admin.users.table.ownStatusProtected', 'Own status protected')}</span> : <AdminPageActions>{user.status !== 'active' && <AdminActionButton disabled={actionLoading} onClick={() => openStatusModal(user, 'active')}>{t('admin.users.actions.activate', 'Activate')}</AdminActionButton>}{user.status !== 'suspended' && <AdminActionButton disabled={actionLoading} onClick={() => openStatusModal(user, 'suspended')}>{t('admin.users.actions.suspend', 'Suspend')}</AdminActionButton>}{user.role?.name !== 'user' && <AdminActionButton disabled={actionLoading} onClick={() => updateRole(user.id, 'user')}>{t('admin.users.actions.makeUser', 'Make User')}</AdminActionButton>}{user.role?.name === 'organizer' && <AdminActionButton disabled={actionLoading} onClick={() => toggleOrganizerVerification(user)}>{user.profile?.is_verified_organizer ? t('admin.users.actions.unverifyOrganizer', 'Unverify Organizer') : t('admin.users.actions.verifyOrganizer', 'Verify Organizer')}</AdminActionButton>}{user.role?.name !== 'organizer' && <AdminActionButton disabled={actionLoading} onClick={() => updateRole(user.id, 'organizer')}>{t('admin.users.actions.makeOrganizer', 'Make Organizer')}</AdminActionButton>}</AdminPageActions>,
    }
  })

  return <PageContainer><AdminHero title={t('admin.users.title', 'Manage users')} description={t('admin.users.description', 'Review accounts, roles and access status across the platform.')} />
    <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4"><UserMetric label={t('admin.users.totalUsers', 'Total users')} value={metrics.total} icon={Users} gradient="from-indigo-600 to-blue-700" t={t}/><UserMetric label={t('admin.users.activeUsers', 'Active')} value={metrics.active} icon={UserCheck} gradient="from-teal-600 to-emerald-700" t={t}/><UserMetric label={t('admin.users.suspendedUsers', 'Suspended')} value={metrics.suspended} icon={UserX} gradient="from-rose-600 to-pink-700" t={t}/><UserMetric label={t('admin.users.organizersCount', 'Organizers')} value={metrics.organizers} icon={ShieldCheck} gradient="from-amber-500 to-orange-700" t={t}/></div>
    <Card className="my-6"><div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder={t('admin.users.searchPlaceholder', 'Search by name or email')} className="pl-10"/></div><Select name="role" value={filters.role} onChange={updateFilter}><option value="all">{t('admin.users.roleFilter.all', 'All roles')}</option><option value="user">{t('admin.users.roleFilter.user', 'Users')}</option><option value="organizer">{t('admin.users.roleFilter.organizer', 'Organizers')}</option><option value="admin">{t('admin.users.roleFilter.admin', 'Admins')}</option></Select><Select name="status" value={filters.status} onChange={updateFilter}><option value="all">{t('admin.users.statusFilter.all', 'All statuses')}</option><option value="active">{t('admin.users.statusFilter.active', 'Active')}</option><option value="pending_approval">{t('admin.users.statusFilter.pending_approval', 'Pending approval')}</option><option value="suspended">{t('admin.users.statusFilter.suspended', 'Suspended')}</option></Select><Button type="button" onClick={fetchUsers}>{t('admin.common.search', 'Search')}</Button><Button type="button" variant="secondary" onClick={resetFilters}>{t('admin.common.reset', 'Reset')}</Button></div></Card>
    {loading && <Loader message={t('admin.common.loading', { type: t('admin.users.title', 'users') }, 'Loading users...')}/>}{error && <ErrorState title={t('admin.common.errorTitle', 'Error')} message={error}/>} {!loading && !error && <Table columns={[{key:'user',label:t('admin.users.table.user', 'User')},{key:'email',label:t('admin.users.table.email', 'Email')},{key:'role',label:t('admin.users.table.role', 'Role')},{key:'location',label:t('admin.users.table.location', 'Location')},{key:'status',label:t('admin.users.table.status', 'Status')},{key:'joined',label:t('admin.users.table.joined', 'Joined')},{key:'actions',label:t('admin.common.actions', 'Actions')}]} rows={rows}/>} 
    <Modal open={statusModal.open} title={statusModal.status === 'suspended' ? t('admin.users.modals.suspendAccount', 'Suspend account') : t('admin.users.modals.activateAccount', 'Activate account')} onClose={closeStatusModal}>
      <form onSubmit={submitStatusUpdate} className="grid gap-4">
        <Alert type={statusModal.status === 'suspended' ? 'warning' : 'info'}>{statusModal.status === 'suspended' ? t('admin.users.modals.suspendMessage', { name: statusModal.user?.name }, `This will disable ${statusModal.user?.name}'s access and send an email notification with the reason.`) : t('admin.users.modals.activateMessage', { name: statusModal.user?.name }, `This will reactivate ${statusModal.user?.name}'s access and send an email notification.`)}</Alert>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">{t('admin.users.modals.reasonLabel', 'Reason sent by email')}</span>
          <Select value={statusModal.selectedReason} onChange={(event) => setStatusModal((current) => ({ ...current, selectedReason: event.target.value }))} required>
            <option value="">{t('admin.users.modals.chooseReason', 'Choose a reason')}</option>
            {(statusModal.status === 'suspended' ? SUSPENSION_REASONS : ACTIVATION_REASONS).map((reason) => <option key={reason} value={reason}>{reason}</option>)}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">{t('admin.users.modals.detailsLabel', 'Additional details')} {statusModal.selectedReason === 'Other' ? t('admin.users.modals.detailsRequired', '(required)') : t('admin.users.modals.detailsOptional', '(optional)')}</span>
          <Textarea value={statusModal.details} onChange={(event) => setStatusModal((current) => ({ ...current, details: event.target.value }))} rows="4" placeholder={statusModal.status === 'suspended' ? t('admin.users.modals.suspensionHelper', 'Add details that will help the user understand the suspension.') : t('admin.users.modals.activationHelper', 'Add a short note for the user if needed.')} required={statusModal.selectedReason === 'Other'} />
        </label>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={closeStatusModal}>{t('admin.common.cancel', 'Cancel')}</Button><Button type="submit" disabled={actionLoading}>{actionLoading ? t('admin.common.saving', 'Saving...') : statusModal.status === 'suspended' ? t('admin.users.modals.suspendButton', 'Suspend account') : t('admin.users.modals.activateButton', 'Activate account')}</Button></div>
      </form>
    </Modal>
  </PageContainer>
}
