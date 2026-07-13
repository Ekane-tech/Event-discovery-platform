import axiosClient from '../../../shared/api/axiosClient.js'

export const notificationPreferenceService = {
  getPreferences: () => axiosClient.get('/notification-preferences'),
  updatePreferences: (payload) => axiosClient.put('/notification-preferences', payload),
}
