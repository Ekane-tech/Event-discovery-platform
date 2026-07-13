import axiosClient from '../../../shared/api/axiosClient.js'

export const reportService = {
  getReports: (params = {}) => axiosClient.get('/reports', { params }),
  getReport: (reportId) => axiosClient.get(`/reports/${reportId}`),
  reportEvent: (eventId, payload) => axiosClient.post(`/events/${eventId}/report`, payload),
}
