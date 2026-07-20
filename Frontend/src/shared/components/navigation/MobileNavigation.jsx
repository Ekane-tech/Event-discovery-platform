import { Link, NavLink } from 'react-router-dom'
import { APP_NAME } from '../../constants/app.js'
import Button from '../ui/Button.jsx'
import NavigationBadge from './NavigationBadge.jsx'
import NavIcon from './NavIcon.jsx'
import { useTranslation } from '../../i18n/useTranslation.js'

export default function MobileNavigation({ open, groups = [], unreadCount = 0, isAuthenticated, user, onLogout, onClose, variant = 'drawer' }) {
  const { t } = useTranslation()

  if (!open) return null

  function getBadgeCount(link) {
    return link.badge === 'notifications' ? unreadCount : 0
  }

  if (variant === 'dropdown') {
    return (
      <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
        {isAuthenticated && (
          <div className="mb-4 rounded-2xl bg-teal-50 p-4">
            <p className="font-bold text-slate-950">{user?.name}</p>
            <p className="truncate text-sm text-slate-600">{user?.email}</p>
            <p className="mt-1 text-xs capitalize text-teal-700">{user?.role}</p>
          </div>
        )}
        <div className="grid gap-5">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{group.title}</p>
              <nav className="grid gap-1">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <NavIcon name={link.icon} />
                      <span className="truncate">{t(link.labelKey, link.label)}</span>
                    </span>
                    <NavigationBadge count={getBadgeCount(link)} />
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          {isAuthenticated ? (
            <Button variant="secondary" className="w-full" onClick={onLogout}>Logout</Button>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className="flex-1"><Button variant="secondary" className="w-full">Login</Button></Link>
              <Link to="/register" onClick={onClose} className="flex-1"><Button className="w-full">Register</Button></Link>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] xl:hidden">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative flex h-full w-[62vw] min-w-[260px] max-w-[340px] animate-[slideInLeft_.22s_ease-out] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <img src="/applogo.png" alt={APP_NAME} className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-lg shadow-teal-200" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-950">{APP_NAME}</p>
          </div>
        </div>
        <div className="border-b border-slate-100 p-4">
          {isAuthenticated ? (
            <div className="rounded-2xl bg-teal-50 p-4">
              <p className="font-bold text-slate-950">{user?.name}</p>
              <p className="truncate text-sm text-slate-600">{user?.email}</p>
              <p className="mt-1 text-xs capitalize text-teal-700">{user?.role}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-950">Welcome</p>
              <p className="text-sm text-slate-600">Discover events across Cameroon.</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-5">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{group.title}</p>
                <nav className="grid gap-1">
                  {group.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      className={({ isActive }) => `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <NavIcon name={link.icon} />
                        <span className="truncate">{t(link.labelKey, link.label)}</span>
                      </span>
                      <NavigationBadge count={getBadgeCount(link)} />
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          {isAuthenticated ? (
            <Button variant="secondary" className="w-full" onClick={onLogout}>Logout</Button>
          ) : (
            <div className="grid gap-2">
              <Link to="/login" onClick={onClose}><Button variant="secondary" className="w-full">Login</Button></Link>
              <Link to="/register" onClick={onClose}><Button className="w-full">Register</Button></Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
