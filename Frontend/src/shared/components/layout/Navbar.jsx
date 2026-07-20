import { useState } from 'react'
import { Bell, Menu, X, Home } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { APP_NAME } from '../../constants/app.js'
import { useAuth } from '../../../features/auth/hooks/useAuth.js'
import { useNotifications } from '../../../features/notifications/hooks/useNotifications.js'
import { getDesktopNavbarLinks, getMobileNavigationGroups } from '../../constants/navigation.js'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import MobileNavigation from '../navigation/MobileNavigation.jsx'
import NavigationBadge from '../navigation/NavigationBadge.jsx'
import LanguageSwitcher from '../language/LanguageSwitcher.jsx'
import { useTranslation } from '../../i18n/useTranslation.js'

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`

export default function Navbar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, role, logout } = useAuth()
  const { unreadCount } = useNotifications()
  
  const desktopLinks = getDesktopNavbarLinks(role, isAuthenticated)
  const mobileGroups = getMobileNavigationGroups(role, isAuthenticated)

  async function handleLogout() {
    setMobileMenuOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  function getBadgeCount(link) {
    return link.badge === 'notifications' ? unreadCount : 0
  }

  return (
    <>
      <header className="sticky top-0 z-[9999] border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 font-black text-slate-950">
            <img src="/applogo.png" alt={APP_NAME} className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-lg shadow-teal-100" />
            <span className="hidden max-w-[190px] truncate sm:inline">{APP_NAME}</span>
          </Link>
          
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {t(link.labelKey, link.label)}
                <NavigationBadge count={getBadgeCount(link)} />
              </NavLink>
            ))}
          </nav>
          
          <div className="hidden items-center gap-2 lg:flex">
            {/* <LanguageSwitcher compact /> */}
            {isAuthenticated ? (
              <>
                <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700">
                  <Home className="h-4 w-4" />Home
                </Link>
                <Link to="/public-notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                  <Bell className="h-5 w-5" />
                </Link>
                <Link to="/profile" className="rounded-full focus:outline-none focus:ring-4 focus:ring-teal-100" title="Open profile">
                  <Avatar name={user?.name} src={user?.avatar} />
                </Link>
                <Link to="/profile" className="max-w-48 truncate text-sm text-slate-600 hover:text-teal-700">
                  {user?.name} <span className="text-slate-400">({role})</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/public-notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                  <Bell className="h-5 w-5" />
                </Link>
                <Link to="/feedback"><Button variant="secondary">Feedback</Button></Link>
                <Link to="/login"><Button variant="secondary">Login</Button></Link>
                <Link to="/register"><Button>Register</Button></Link>
              </>
            )}
          </div>
          
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 lg:hidden" aria-label="Toggle navigation menu">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            {isAuthenticated && <NavigationBadge count={unreadCount} />}
          </button>
        </div>

        {/* Menu pour les visiteurs (Non connectés) : affichage en Dropdown */}
        {!isAuthenticated && (
          <MobileNavigation
            variant="dropdown"
            open={mobileMenuOpen}
            groups={mobileGroups}
            unreadCount={unreadCount}
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            onClose={() => setMobileMenuOpen(false)}
          />
        )}
      </header>

      {/* Menu pour les utilisateurs connectés : affichage en tiroir latéral (Drawer) */}
      {isAuthenticated && (
        <MobileNavigation
          variant="drawer"
          open={mobileMenuOpen}
          groups={mobileGroups}
          unreadCount={unreadCount}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
