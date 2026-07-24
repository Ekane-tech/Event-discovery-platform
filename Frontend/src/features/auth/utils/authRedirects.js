import { ROLES } from '../../../shared/constants/roles.js'

export function getDashboardPathByRole(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard'
    case ROLES.ORGANIZER:
      return '/organizer/dashboard'
    case ROLES.USER:
    default:
      return '/'
  }
}