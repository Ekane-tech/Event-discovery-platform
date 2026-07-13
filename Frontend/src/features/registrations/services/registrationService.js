import axiosClient from '../../../shared/api/axiosClient.js'

export const registrationService = {
  getRegistrations: (params = {}) => axiosClient.get('/registrations', { params }),
  getRegistration: (registrationId) => axiosClient.get(`/registrations/${registrationId}`),
  registerForEvent: (eventId) => axiosClient.post(`/events/${eventId}/register`),
  cancelRegistration: (eventId) => axiosClient.delete(`/events/${eventId}/registration`),
}
