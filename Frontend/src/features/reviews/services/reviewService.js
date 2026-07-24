import axiosClient from '../../../shared/api/axiosClient.js'

export const reviewService = {
  getReviews: (eventId, params = {}) => axiosClient.get(`/events/${eventId}/reviews`, { params }),
  getSummary: (eventId) => axiosClient.get(`/events/${eventId}/reviews/summary`),
  createReview: (eventId, payload) => axiosClient.post(`/events/${eventId}/reviews`, payload),
  updateReview: (eventId, reviewId, payload) => axiosClient.put(`/events/${eventId}/reviews/${reviewId}`, payload),
  deleteReview: (eventId, reviewId) => axiosClient.delete(`/events/${eventId}/reviews/${reviewId}`),
}
