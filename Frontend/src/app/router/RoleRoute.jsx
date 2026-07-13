import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth.js'
import { getDashboardPathByRole } from '../../features/auth/utils/authRedirects.js'

export default function RoleRoute({ allowedRoles = [] }) {
  const { role } = useAuth()

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPathByRole(role)} replace />
  }

  return <Outlet />
}
