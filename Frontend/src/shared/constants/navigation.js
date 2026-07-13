import { ROLES } from './roles.js'

export const PUBLIC_NAV_LINKS = [
  { label: 'Browse Events', labelKey: 'nav.browseEvents', to: '/events', icon: 'calendarSearch' },
  { label: 'About', labelKey: 'nav.about', to: '/about', icon: 'sparkles' },
]

export const USER_NAV_LINKS = [
  { label: 'Dashboard', labelKey: 'nav.dashboard', to: '/dashboard', icon: 'layoutDashboard' },
  { label: 'Recommendations', labelKey: 'nav.recommendations', to: '/recommendations', icon: 'sparkles' },
  { label: 'Events', labelKey: 'nav.events', to: '/events', icon: 'calendarDays' },
  { label: 'Notifications', labelKey: 'nav.notifications', to: '/notifications', badge: 'notifications', icon: 'bell' },
  { label: 'My Interests', labelKey: 'nav.interests', to: '/my-interests', icon: 'heart' },
  { label: 'Bookmarks', labelKey: 'nav.bookmarks', to: '/bookmarks', icon: 'bookmark' },
  { label: 'Registrations', labelKey: 'nav.registrations', to: '/registrations', icon: 'ticket' },
  { label: 'My Reports', labelKey: 'nav.reports', to: '/reports', icon: 'barChart3' },
  { label: 'Profile', labelKey: 'nav.profile', to: '/profile', icon: 'user' },
  { label: 'Settings', labelKey: 'nav.settings', to: '/settings', icon: 'settings' },
]

export const ACCOUNT_NAV_LINKS = [
  { label: 'Notifications', labelKey: 'nav.notifications', to: '/notifications', badge: 'notifications', icon: 'bell' },
  { label: 'Profile', labelKey: 'nav.profile', to: '/profile', icon: 'user' },
  { label: 'Settings', labelKey: 'nav.settings', to: '/settings', icon: 'settings' },
]

export const ORGANIZER_NAV_LINKS = [
  { label: 'Organizer Dashboard', labelKey: 'nav.organizerDashboard', to: '/organizer/dashboard', icon: 'layoutDashboard' },
  { label: 'My Events', labelKey: 'nav.myEvents', to: '/organizer/events', icon: 'calendarDays' },
  { label: 'Notifications', labelKey: 'nav.notifications', to: '/notifications', badge: 'notifications', icon: 'bell' },
  { label: 'Statistics', labelKey: 'nav.statistics', to: '/organizer/statistics', icon: 'barChart3' },
]

export const ADMIN_NAV_LINKS = [
  { label: 'Admin Dashboard', labelKey: 'nav.adminDashboard', to: '/admin/dashboard', icon: 'layoutDashboard' },
  { label: 'Users', labelKey: 'nav.users', to: '/admin/users', icon: 'users' },
  { label: 'Events', labelKey: 'nav.events', to: '/admin/events', icon: 'calendarCheck' },
  { label: 'Payments', labelKey: 'nav.payments', to: '/admin/payments', icon: 'creditCard' },
  { label: 'Categories', labelKey: 'nav.categories', to: '/admin/categories', icon: 'boxes' },
  { label: 'Locations', labelKey: 'nav.locations', to: '/admin/locations', icon: 'mapPin' },
  { label: 'Reports', labelKey: 'nav.adminReports', to: '/admin/reports', icon: 'barChart3' },
  { label: 'Announcements', labelKey: 'nav.announcements', to: '/admin/announcements', icon: 'send' },
  { label: 'Feedback', labelKey: 'nav.adminFeedback', to: '/admin/feedback', badge: 'feedback', icon: 'heart' },
  { label: 'Audit Logs', labelKey: 'nav.auditLogs', to: '/admin/audit-logs', icon: 'history' },
]

export function getPrimaryDashboardPath(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard'
  if (role === ROLES.ORGANIZER) return '/organizer/dashboard'
  return '/dashboard'
}

export function getNotificationPathByRole(role) {
  if (role === ROLES.ADMIN) return '/admin/notifications'
  return '/notifications'
}

export function getDesktopNavbarLinks(role, isAuthenticated) {
  if (!isAuthenticated) return PUBLIC_NAV_LINKS

  const links = [
    ...PUBLIC_NAV_LINKS,
    { label: 'Dashboard', labelKey: 'nav.dashboard', to: getPrimaryDashboardPath(role), icon: 'layoutDashboard' },
    { label: 'Notifications', labelKey: 'nav.notifications', to: getNotificationPathByRole(role), badge: 'notifications', icon: 'bell' },
  ]

  if (role === ROLES.USER) links.push({ label: 'Recommendations', labelKey: 'nav.recommendations', to: '/recommendations', icon: 'sparkles' })
  if (role === ROLES.ORGANIZER) links.push({ label: 'My Events', labelKey: 'nav.myEvents', to: '/organizer/events', icon: 'calendarDays' })
  if (role === ROLES.ADMIN) links.push({ label: 'Admin', labelKey: 'nav.admin', to: '/admin/dashboard', icon: 'shield' })

  return links
}

export function getMobileNavigationGroups(role, isAuthenticated) {
  const groups = [{ title: 'Discover', links: PUBLIC_NAV_LINKS }]
  if (!isAuthenticated) return groups
  if (role === ROLES.USER) return [...groups, { title: 'My Account', links: USER_NAV_LINKS }]
  if (role === ROLES.ORGANIZER) return [...groups, { title: 'Organizer', links: ORGANIZER_NAV_LINKS }, { title: 'Account', links: ACCOUNT_NAV_LINKS.filter((link) => link.to !== '/notifications') }]
  if (role === ROLES.ADMIN) return [...groups, { title: 'Administration', links: ADMIN_NAV_LINKS }, { title: 'Account', links: ACCOUNT_NAV_LINKS.filter((link) => link.to !== '/notifications') }]
  return [...groups, { title: 'Account', links: ACCOUNT_NAV_LINKS }]
}

export function getSidebarLinks(section, role) {
  if (section === 'organizer') return ORGANIZER_NAV_LINKS
  if (section === 'admin') return ADMIN_NAV_LINKS
  if (role === ROLES.USER) return USER_NAV_LINKS
  if (role === ROLES.ORGANIZER) return ORGANIZER_NAV_LINKS
  if (role === ROLES.ADMIN) return ADMIN_NAV_LINKS
  return ACCOUNT_NAV_LINKS
}
