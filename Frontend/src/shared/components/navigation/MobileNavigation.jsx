import { Link, NavLink } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import NavigationBadge from './NavigationBadge.jsx'
import NavIcon from './NavIcon.jsx'

export default function MobileNavigation({ open, groups = [], unreadCount = 0, isAuthenticated, user, onLogout, onClose }) {
  if (!open) return null

  function getBadgeCount(link) {
    return link.badge === 'notifications' ? unreadCount : 0
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
      {isAuthenticated && (
        <div className="mb-4 rounded-2xl bg-teal-50 p-4">
          <p className="font-bold text-slate-950">{user?.name}</p>
          <p className="text-sm text-slate-600">{user?.email}</p>
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
                  <span className="flex items-center gap-3">
                    <NavIcon name={link.icon} />
                    {link.label}
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