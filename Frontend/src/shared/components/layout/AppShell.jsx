import { Bell, Home, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../../constants/app.js'
import { getMobileNavigationGroups, getNotificationPathByRole } from '../../constants/navigation.js'
import { useAuth } from '../../../features/auth/hooks/useAuth.js'
import { useNotifications } from '../../../features/notifications/hooks/useNotifications.js'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import MobileNavigation from '../navigation/MobileNavigation.jsx'
import NavigationBadge from '../navigation/NavigationBadge.jsx'
import RoleSidebar from '../navigation/RoleSidebar.jsx'
import LanguageSwitcher from '../language/LanguageSwitcher.jsx'

const SIDEBAR_STORAGE_KEY = 'sidebar_collapsed_v2'

export default function AppShell({ section = 'user' }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false')
  const { isAuthenticated, user, role, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const mobileGroups = getMobileNavigationGroups(role, isAuthenticated)

  useEffect(() => { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed)) }, [sidebarCollapsed])

  async function handleLogout() {
    setLoggingOut(true)
    setMobileMenuOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  if (loggingOut) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">Signing you out...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <RoleSidebar section={section} collapsed={sidebarCollapsed} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 xl:hidden" aria-label="Toggle navigation menu"><Menu className="h-5 w-5" /></button>
              <button type="button" onClick={() => setSidebarCollapsed((current) => !current)} className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-teal-50 hover:text-teal-700 xl:inline-flex" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
              <div className="hidden min-w-0 xl:block"><p className="truncate text-sm font-semibold capitalize text-slate-500">{section} area</p><h1 className="truncate text-lg font-bold text-slate-950">Welcome back, {user?.name}</h1></div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700 sm:px-4"><Home className="h-4 w-4" /><span className="hidden sm:inline">Home</span></Link>
              <Link to={getNotificationPathByRole(role)} className="relative hidden xl:inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"><span className="sr-only">Notifications</span><Bell className="h-5 w-5" /><span className="absolute -right-1 -top-1"><NavigationBadge count={unreadCount} /></span></Link>
              <Link to="/profile" className="rounded-full focus:outline-none focus:ring-4 focus:ring-teal-100" title="Open profile"><Avatar name={user?.name} src={user?.avatar} /></Link>
              <Link to="/profile" className="hidden text-right md:block"><p className="text-sm font-bold text-slate-950 hover:text-teal-700">{user?.name}</p><p className="text-xs capitalize text-slate-500">{role}</p></Link>
            </div>
          </div>
        </header>
        <MobileNavigation open={mobileMenuOpen} groups={mobileGroups} unreadCount={unreadCount} isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} onClose={() => setMobileMenuOpen(false)} />
        <Outlet />
      </div>
    </div>
  )
}
