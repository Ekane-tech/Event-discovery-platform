import { ROLES } from './roles.js'

export const PUBLIC_NAV_LINKS = [
  { label: 'Browse Events', to: '/events', icon: 'calendarSearch' },
  { label: 'About', to: '/about', icon: 'sparkles' },
]

export const USER_NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard', icon: 'layoutDashboard' },
  { label: 'Recommendations', to: '/recommendations', icon: 'sparkles' },
  { label: 'Notifications', to: '/notifications', badge: 'notifications', icon: 'bell' },
  { label: 'My Interests', to: '/my-interests', icon: 'heart' },
  { label: 'Bookmarks', to: '/bookmarks', icon: 'bookmark' },
  { label: 'Registrations', to: '/registrations', icon: 'ticket' },
  { label: 'My Reports', to: '/reports', icon: 'barChart3' },
  { label: 'Profile', to: '/profile', icon: 'user' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
]

export const ACCOUNT_NAV_LINKS = [
  { label: 'Notifications', to: '/notifications', badge: 'notifications', icon: 'bell' },
  { label: 'Profile', to: '/profile', icon: 'user' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
]

export const ORGANIZER_NAV_LINKS = [
  { label: 'Organizer Dashboard', to: '/organizer/dashboard', icon: 'layoutDashboard' },
  { label: 'My Events', to: '/organizer/events', icon: 'calendarDays' },
  { label: 'Create Event', to: '/organizer/events/create', icon: 'plusSquare' },
  { label: 'Statistics', to: '/organizer/statistics', icon: 'barChart3' },
]

export const ADMIN_NAV_LINKS = [
  { label: 'Admin Dashboard', to: '/admin/dashboard', icon: 'layoutDashboard' },
  { label: 'Users', to: '/admin/users', icon: 'users' },
  { label: 'Events', to: '/admin/events', icon: 'calendarCheck' },
  { label: 'Categories', to: '/admin/categories', icon: 'boxes' },
  { label: 'Locations', to: '/admin/locations', icon: 'mapPin' },
  { label: 'Reports', to: '/admin/reports', icon: 'barChart3' },
  { label: 'Notifications', to: '/admin/notifications', icon: 'send' },
  { label: 'Feedback', to: '/admin/feedback', icon: 'heart' },
]

export function getPrimaryDashboardPath(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard'
  if (role === ROLES.ORGANIZER) return '/organizer/dashboard'
  return '/dashboard'
}

export function getDesktopNavbarLinks(role, isAuthenticated) {
  if (!isAuthenticated) return PUBLIC_NAV_LINKS

  const links = [
    ...PUBLIC_NAV_LINKS,
    { label: 'Dashboard', to: getPrimaryDashboardPath(role), icon: 'layoutDashboard' },
    { label: 'Notifications', to: '/notifications', badge: 'notifications', icon: 'bell' },
  ]

  if (role === ROLES.USER) links.push({ label: 'Recommendations', to: '/recommendations', icon: 'sparkles' })
  if (role === ROLES.ORGANIZER) links.push({ label: 'My Events', to: '/organizer/events', icon: 'calendarDays' })
  if (role === ROLES.ADMIN) links.push({ label: 'Admin', to: '/admin/dashboard', icon: 'shield' })

  return links
}

export function getMobileNavigationGroups(role, isAuthenticated) {
  const groups = [{ title: 'Discover', links: PUBLIC_NAV_LINKS }]

  if (!isAuthenticated) return groups

  if (role === ROLES.USER) {
    groups.push({ title: 'My Account', links: USER_NAV_LINKS })
    return groups
  }

  groups.push({ title: 'Account', links: ACCOUNT_NAV_LINKS })
  if (role === ROLES.ORGANIZER) groups.push({ title: 'Organizer', links: ORGANIZER_NAV_LINKS })
  if (role === ROLES.ADMIN) groups.push({ title: 'Administration', links: ADMIN_NAV_LINKS })

  return groups
}

export function getSidebarLinks(section, role) {
  if (section === 'organizer') return ORGANIZER_NAV_LINKS
  if (section === 'admin') return ADMIN_NAV_LINKS
  if (role === ROLES.USER) return USER_NAV_LINKS
  if (role === ROLES.ORGANIZER) return ORGANIZER_NAV_LINKS
  if (role === ROLES.ADMIN) return ADMIN_NAV_LINKS
  return ACCOUNT_NAV_LINKS
}
