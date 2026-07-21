import axiosClient from '../../../shared/api/axiosClient.js'

export const organizerService = {
  getOrganizers: (params = {}) => axiosClient.get('/organizers', { params }),
  getOrganizer: (organizerId) => axiosClient.get(`/organizers/${organizerId}`),
}
