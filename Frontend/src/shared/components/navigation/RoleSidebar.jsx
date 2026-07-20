import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { APP_NAME } from '../../constants/app.js'
import { ROLES } from '../../constants/roles.js'
import { useAuth } from '../../../features/auth/hooks/useAuth.js'
import { useNotifications } from '../../../features/notifications/hooks/useNotifications.js'
import { adminService } from '../../../features/dashboard/admin/services/adminService.js'
import { extractCollection } from '../../../features/events/utils/normalizeEvent.js'
import { getSidebarLinks } from '../../constants/navigation.js'
import NavigationBadge from './NavigationBadge.jsx'
import NavIcon from './NavIcon.jsx'
import { useTranslation } from '../../i18n/useTranslation.js'
const sectionSubtitles = { user: 'User Console', organizer: 'Organizer Console', admin: 'System Console' }
export default function RoleSidebar({ section = 'user', collapsed = false }) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const { unreadCount } = useNotifications()
  const [feedbackCount, setFeedbackCount] = useState(0)
  const links = getSidebarLinks(section, role)
  useEffect(() => {
    async function fetchFeedbackCount() {
      if (role !== ROLES.ADMIN) return
      try {
        const response = await adminService.getFeedbacks({ status: 'new', per_page: 50 })
        setFeedbackCount(extractCollection(response.data, 'feedbacks').length)
      } catch {
        setFeedbackCount(0)
      }
    }
    fetchFeedbackCount()
  }, [role])
  function getBadgeCount(link) {
    if (link.badge === 'notifications') return unreadCount
    if (link.badge === 'feedback') return feedbackCount
    return 0
  }
  return (
    <aside className={`sticky top-0 h-screen shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 flex flex-col w-1/2 ${collapsed ? 'xl:w-24' : 'xl:w-72'}`}>
      <div className={`flex items-center gap-3 border-b border-slate-100 px-5 py-5 ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <img src="/applogo.png" alt={APP_NAME} className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-lg shadow-teal-200" />
          {!collapsed && <div className="min-w-0"><p className="truncate text-lg font-bold text-slate-950">{APP_NAME}</p><p className="text-sm text-slate-500">{sectionSubtitles[section] || 'Console'}</p></div>}
        </div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {links.map((link) => {
          const badgeCount = getBadgeCount(link)
          return (
            <NavLink key={link.to} to={link.to} title={collapsed ? t(link.labelKey, link.label) : undefined} className={({ isActive }) => `group flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${collapsed ? 'justify-center' : 'justify-between'} ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
              <span className={`relative flex min-w-0 items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <NavIcon name={link.icon} className="text-current" />
                {collapsed && <span className="absolute -right-2 -top-2"><NavigationBadge count={badgeCount} /></span>}
                {!collapsed && <span className="truncate">{t(link.labelKey, link.label)}</span>}
              </span>
              {!collapsed && <NavigationBadge count={badgeCount} />}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}