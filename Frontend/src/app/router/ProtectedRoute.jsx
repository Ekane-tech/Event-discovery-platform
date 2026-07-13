import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from '../../shared/components/feedback/Loader.jsx'
import { useAuth } from '../../features/auth/hooks/useAuth.js'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
