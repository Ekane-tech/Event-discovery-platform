import axiosClient from '../../../shared/api/axiosClient.js'

export const dashboardService = {
  getUserDashboard: () => axiosClient.get('/dashboard'),
  getOrganizerDashboard: () => axiosClient.get('/organizer/dashboard'),
  getAdminDashboard: () => axiosClient.get('/admin/dashboard'),
}
