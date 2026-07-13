import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UserCheck, UserCog, UserX, Users } from 'lucide-react'
import AdminHero from '../components/AdminHero.jsx'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import Card from '../../../../shared/components/ui/Card.jsx'
import Input from '../../../../shared/components/ui/Input.jsx'
import Select from '../../../../shared/components/ui/Select.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import Avatar from '../../../../shared/components/ui/Avatar.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-purple-100 text-purple-800',
    organizer: 'bg-blue-100 text-blue-800',
    user: 'bg-teal-100 text-teal-800',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[role] || 'bg-slate-100 text-slate-700'}`}>
      {role || 'unknown'}
    </span>
  )
}

function UserMetric({ label, value, icon: Icon, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-sm`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15" />
      <Icon className="relative h-6 w-6" />
      <p className="relative mt-3 text-3xl font-black">{value}</p>
      <p className="relative text-sm text-white/85">{label}</p>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ keyword: '', role: 'all', status: 'all' })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  function buildParams() {
    const params = { per_page: 50 }
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim()
    if (filters.role !== 'all') params.role = filters.role
    if (filters.status !== 'all') params.status = filters.status
    return params
  }

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getUsers(buildParams())
      setUsers(extractCollection(response.data, 'users'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load users.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function resetFilters() {
    setFilters({ keyword: '', role: 'all', status: 'all' })
    setTimeout(fetchUsers, 0)
  }

  async function updateStatus(userId, status) {
    setActionLoading(true)
    try {
      await adminService.updateUserStatus(userId, status)
      toast.success(`User ${status === 'suspended' ? 'suspended' : 'activated'} successfully.`)
      await fetchUsers()
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, 'Unable to update user status.'))
    } finally {
      setActionLoading(false)
    }
  }

  async function updateRole(userId, role) {
    setActionLoading(true)
    try {
      await adminService.updateUserRole(userId, role)
      toast.success('User role updated successfully.')
      await fetchUsers()
    } catch (roleError) {
      toast.error(getApiErrorMessage(roleError, 'Unable to update user role.'))
    } finally {
      setActionLoading(false)
    }
  }

  const metrics = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.status === 'active').length,
    suspended: users.filter((user) => user.status === 'suspended').length,
    organizers: users.filter((user) => user.role?.name === 'organizer').length,
  }), [users])

  const rows = users.map((user) => ({
    id: user.id,
    user: (
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.profile?.avatar} />
        <div>
          <p className="font-bold text-slate-950">{user.name}</p>
          <p className="text-xs text-slate-500">#{user.id}</p>
        </div>
      </div>
    ),
    email: <span className="text-slate-600">{user.email}</span>,
    role: <RoleBadge role={user.role?.name} />,
    location: <span className="text-slate-600">{user.profile?.city || '—'}{user.profile?.region ? `, ${user.profile.region}` : ''}</span>,
    status: <AdminStatusBadge status={user.status} />,
    joined: <span className="text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>,
    actions: (
      <AdminPageActions>
        {user.status !== 'active' && <AdminActionButton disabled={actionLoading} onClick={() => updateStatus(user.id, 'active')}>Activate</AdminActionButton>}
        {user.status !== 'suspended' && <AdminActionButton disabled={actionLoading} onClick={() => updateStatus(user.id, 'suspended')}>Suspend</AdminActionButton>}
        {user.role?.name !== 'user' && <AdminActionButton disabled={actionLoading} onClick={() => updateRole(user.id, 'user')}>Make User</AdminActionButton>}
        {user.role?.name !== 'organizer' && <AdminActionButton disabled={actionLoading} onClick={() => updateRole(user.id, 'organizer')}>Make Organizer</AdminActionButton>}
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <AdminHero title="Manage users" description="Review accounts, roles and access status across the platform." />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UserMetric label="Total users" value={metrics.total} icon={Users} gradient="from-indigo-600 to-blue-700" />
        <UserMetric label="Active" value={metrics.active} icon={UserCheck} gradient="from-teal-600 to-emerald-700" />
        <UserMetric label="Suspended" value={metrics.suspended} icon={UserX} gradient="from-rose-600 to-pink-700" />
        <UserMetric label="Organizers" value={metrics.organizers} icon={ShieldCheck} gradient="from-amber-500 to-orange-700" />
      </div>

      <Card className="my-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="keyword" value={filters.keyword} onChange={updateFilter} placeholder="Search by name or email" className="pl-10" />
          </div>
          <Select name="role" value={filters.role} onChange={updateFilter}>
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="organizer">Organizers</option>
            <option value="admin">Admins</option>
          </Select>
          <Select name="status" value={filters.status} onChange={updateFilter}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending approval</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Button type="button" onClick={fetchUsers}>Search</Button>
          <Button type="button" variant="secondary" onClick={resetFilters}>Reset</Button>
        </div>
      </Card>

      {loading && <Loader message="Loading users..." />}
      {error && <ErrorState title="Unable to load users" message={error} />}
      {!loading && !error && (
        <Table
          columns={[
            { key: 'user', label: 'User' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status' },
            { key: 'joined', label: 'Joined' },
            { key: 'actions', label: 'Actions' },
          ]}
          rows={rows}
        />
      )}
    </PageContainer>
  )
}
