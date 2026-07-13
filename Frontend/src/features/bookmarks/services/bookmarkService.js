import axiosClient from '../../../shared/api/axiosClient.js'

export const bookmarkService = {
  getBookmarks: (params = {}) => axiosClient.get('/bookmarks', { params }),
  addBookmark: (eventId) => axiosClient.post(`/events/${eventId}/bookmark`),
  removeBookmark: (eventId) => axiosClient.delete(`/events/${eventId}/bookmark`),
}
