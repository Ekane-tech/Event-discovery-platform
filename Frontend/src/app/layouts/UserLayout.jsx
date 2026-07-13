import AppShell from '../../shared/components/layout/AppShell.jsx'
import { ROLES } from '../../shared/constants/roles.js'
import { useAuth } from '../../features/auth/hooks/useAuth.js'

function getSectionForRole(role) {
  if (role === ROLES.ADMIN) return 'admin'
  if (role === ROLES.ORGANIZER) return 'organizer'
  return 'user'
}

export default function UserLayout() {
  const { role } = useAuth()
  return <AppShell section={getSectionForRole(role)} />
}
