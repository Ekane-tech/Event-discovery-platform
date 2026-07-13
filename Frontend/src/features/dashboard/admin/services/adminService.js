import axiosClient from '../../../../shared/api/axiosClient.js'

function multipartConfig(payload) {
  return payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
}

export const adminService = {
  getUsers: (params = {}) => axiosClient.get('/admin/users', { params }),
  updateUserRole: (userId, role) => axiosClient.patch(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId, status) => axiosClient.patch(`/admin/users/${userId}/status`, { status }),

  getEvents: (params = {}) => axiosClient.get('/admin/events', { params }),
  getPayments: (params = {}) => axiosClient.get('/admin/payments', { params }),
  getPaymentSummary: () => axiosClient.get('/admin/payments/summary'),
  getAuditLogs: (params = {}) => axiosClient.get('/admin/audit-logs', { params }),
  updateEventStatus: (eventId, status, moderationReason = '') => axiosClient.patch(`/admin/events/${eventId}/status`, { status, moderation_reason: moderationReason || null }),

  getReports: (params = {}) => axiosClient.get('/admin/reports', { params }),
  updateReportStatus: (reportId, status) => axiosClient.patch(`/admin/reports/${reportId}/status`, { status }),

  getFeedbacks: (params = {}) => axiosClient.get('/admin/feedback', { params }),
  updateFeedbackStatus: (feedbackId, status) => axiosClient.patch(`/admin/feedback/${feedbackId}/status`, { status }),

  getAnnouncements: (params = {}) => axiosClient.get('/admin/announcements', { params }),
  createAnnouncement: (payload) => axiosClient.post('/admin/announcements', payload),
  sendAnnouncement: (announcementId) => axiosClient.patch(`/admin/announcements/${announcementId}/send`),

  getCategories: (params = {}) => axiosClient.get('/categories', { params }),
  createCategory: (payload) => axiosClient.post('/categories', payload, multipartConfig(payload)),
  updateCategory: (categoryId, payload) => axiosClient.post(`/categories/${categoryId}`, payload, multipartConfig(payload)),
  deleteCategory: (categoryId) => axiosClient.delete(`/categories/${categoryId}`),

  getRegions: (params = {}) => axiosClient.get('/regions', { params }),
  getDivisions: (params = {}) => axiosClient.get('/divisions', { params }),
  getCities: (params = {}) => axiosClient.get('/cities', { params }),
  createRegion: (payload) => axiosClient.post('/regions', payload),
  updateRegion: (regionId, payload) => axiosClient.put(`/regions/${regionId}`, payload),
  deleteRegion: (regionId) => axiosClient.delete(`/regions/${regionId}`),
  createDivision: (payload) => axiosClient.post('/divisions', payload),
  updateDivision: (divisionId, payload) => axiosClient.put(`/divisions/${divisionId}`, payload),
  deleteDivision: (divisionId) => axiosClient.delete(`/divisions/${divisionId}`),
  createCity: (payload) => axiosClient.post('/cities', payload),
  updateCity: (cityId, payload) => axiosClient.put(`/cities/${cityId}`, payload),
  deleteCity: (cityId) => axiosClient.delete(`/cities/${cityId}`),
}
