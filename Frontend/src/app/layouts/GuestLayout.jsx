import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../../shared/components/layout/Navbar.jsx'
import Footer from '../../shared/components/layout/Footer.jsx'
import AppShell from '../../shared/components/layout/AppShell.jsx'
import { ROLES } from '../../shared/constants/roles.js'
import { useAuth } from '../../features/auth/hooks/useAuth.js'

const ALWAYS_PUBLIC_PATHS = ['/', '/about', '/feedback', '/public-notifications']

function isPublicDiscoveryPath(pathname) {
  return pathname === '/events' || pathname.startsWith('/events/')
}

function getShellSection(role) {
  if (role === ROLES.ADMIN) return 'admin'
  if (role === ROLES.ORGANIZER) return 'organizer'
  return 'user'
}

export default function GuestLayout() {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()
  const shouldUsePublicLayout = ALWAYS_PUBLIC_PATHS.includes(location.pathname) || isPublicDiscoveryPath(location.pathname)

  if (isAuthenticated && !shouldUsePublicLayout) return <AppShell section={getShellSection(role)} />

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}
