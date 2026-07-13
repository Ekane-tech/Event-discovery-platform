import axiosClient from '../../../shared/api/axiosClient.js'

export const recommendationService = {
  getRecommendations: (params = {}) => axiosClient.get('/recommendations', { params }),
}
