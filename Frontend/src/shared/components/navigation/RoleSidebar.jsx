import { ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { APP_NAME } from '../../constants/app.js'
import { useAuth } from '../../../features/auth/hooks/useAuth.js'
import { useNotifications } from '../../../features/notifications/hooks/useNotifications.js'
import { getSidebarLinks } from '../../constants/navigation.js'
import NavigationBadge from './NavigationBadge.jsx'
import NavIcon from './NavIcon.jsx'

const sectionSubtitles = {
  user: 'User Console',
  organizer: 'Organizer Console',
  admin: 'System Console',
}

export default function RoleSidebar({ section = 'user', collapsed = false }) {
  const { role } = useAuth()
  const { unreadCount } = useNotifications()
  const links = getSidebarLinks(section, role)

  function getBadgeCount(link) {
    return link.badge === 'notifications' ? unreadCount : 0
  }

  return (
    <aside className={`sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 xl:flex xl:flex-col ${collapsed ? 'w-24' : 'w-72'}`}>
      <div className={`flex items-center gap-3 border-b border-slate-100 px-5 py-5 ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-950">{APP_NAME}</p>
              <p className="text-sm text-slate-500">{sectionSubtitles[section] || 'Console'}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) => `group flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              collapsed ? 'justify-center' : 'justify-between'
            } ${
              isActive
                ? 'bg-teal-50 text-teal-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <span className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <NavIcon name={link.icon} className="text-current" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </span>
            {!collapsed && <NavigationBadge count={getBadgeCount(link)} />}
          </NavLink>
        ))}
      </nav>

      {/* <div className="border-t border-slate-100 p-4">
        <div className={`rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? role?.slice(0, 1)?.toUpperCase() : <span className="capitalize">Current role: <strong>{role}</strong></span>}
        </div>
      </div> */}
    </aside>
  )
}
