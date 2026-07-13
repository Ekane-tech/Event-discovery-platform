import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import PageContainer from '../../../../shared/components/layout/PageContainer.jsx'
import SectionHeader from '../../../../shared/components/layout/SectionHeader.jsx'
import Table from '../../../../shared/components/ui/Table.jsx'
import ErrorState from '../../../../shared/components/feedback/ErrorState.jsx'
import Loader from '../../../../shared/components/feedback/Loader.jsx'
import { extractCollection } from '../../../events/utils/normalizeEvent.js'
import { getApiErrorMessage } from '../../../auth/utils/normalizeAuthUser.js'
import AdminPageActions, { AdminActionButton } from '../components/AdminPageActions.jsx'
import AdminStatusBadge from '../components/AdminStatusBadge.jsx'
import { adminService } from '../services/adminService.js'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getUsers({ per_page: 50 })
      setUsers(extractCollection(response.data, 'users'))
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load users.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  async function updateStatus(userId, status) {
    await adminService.updateUserStatus(userId, status)
    await fetchUsers()
  }

  async function updateRole(userId, role) {
    await adminService.updateUserRole(userId, role)
    await fetchUsers()
  }

  const rows = users.map((user) => ({
    ...user,
    role: <span className="capitalize">{user.role?.name || '—'}</span>,
    city: user.profile?.city || '—',
    region: user.profile?.region || '—',
    status: <AdminStatusBadge status={user.status} />,
    actions: (
      <AdminPageActions>
        {user.status !== 'active' && <AdminActionButton onClick={() => updateStatus(user.id, 'active')}>Activate</AdminActionButton>}
        {user.status !== 'suspended' && <AdminActionButton onClick={() => updateStatus(user.id, 'suspended')}>Suspend</AdminActionButton>}
        {user.role?.name !== 'user' && <AdminActionButton onClick={() => updateRole(user.id, 'user')}>Make User</AdminActionButton>}
        {user.role?.name !== 'organizer' && <AdminActionButton onClick={() => updateRole(user.id, 'organizer')}>Make Organizer</AdminActionButton>}
      </AdminPageActions>
    ),
  }))

  return (
    <PageContainer>
      <SectionHeader title="Manage Users" description="Approve organizers and manage registered user accounts." />
      {loading && <Loader message="Loading users..." />}
      {error && <ErrorState title="Unable to load users" message={error} />}
      {!loading && !error && <Table columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'city', label: 'City' }, { key: 'region', label: 'Region' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }]} rows={rows} />}
    </PageContainer>
  )
}
