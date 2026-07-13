import axiosClient from '../../../shared/api/axiosClient.js'
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints.js'

export const notificationService = {
  getNotifications: (params = {}) => axiosClient.get(API_ENDPOINTS.notifications, { params }),
  markAsRead: (id) => axiosClient.patch(`${API_ENDPOINTS.notifications}/${id}/read`),
  markAllAsRead: () => axiosClient.patch(`${API_ENDPOINTS.notifications}/read-all`),
}
