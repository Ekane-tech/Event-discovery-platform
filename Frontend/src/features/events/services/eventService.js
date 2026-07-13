import axiosClient from '../../../shared/api/axiosClient.js'
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints.js'

export const eventService = {
  getEvents: (params = {}) => axiosClient.get(API_ENDPOINTS.events, { params }),
  getEvent: (id) => axiosClient.get(`${API_ENDPOINTS.events}/${id}`),
  getOrganizerEvents: (params = {}) => axiosClient.get('/organizer/events', { params }),
  getOrganizerEvent: (id) => axiosClient.get(`/organizer/events/${id}`),
  getOrganizerEventAttendees: (id, params = {}) => axiosClient.get(`/organizer/events/${id}/attendees`, { params }),
  createEvent: (payload) => axiosClient.post(API_ENDPOINTS.events, payload),
  updateEvent: (id, payload) => axiosClient.put(`${API_ENDPOINTS.events}/${id}`, payload),
  deleteEvent: (id) => axiosClient.delete(`${API_ENDPOINTS.events}/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/admin/events/${id}/status`, { status }),
  uploadImages: (id, formData) => axiosClient.post(`/events/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteImage: (eventId, imageId) => axiosClient.delete(`/events/${eventId}/images/${imageId}`),
}
