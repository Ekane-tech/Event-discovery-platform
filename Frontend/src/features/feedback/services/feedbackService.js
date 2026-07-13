import axiosClient from '../../../shared/api/axiosClient.js'

export const feedbackService = {
  submitFeedback: (payload) => axiosClient.post('/feedback', payload),
}
