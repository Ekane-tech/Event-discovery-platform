import axiosClient from '../../../shared/api/axiosClient.js'

export const paymentService = {
  getPayments: (params = {}) => axiosClient.get('/payments', { params }),
  getPayment: (paymentId) => axiosClient.get(`/payments/${paymentId}`),
  initiatePayment: (paymentId, payload) => axiosClient.post(`/payments/${paymentId}/initiate`, payload),
  confirmPayment: (paymentId) => axiosClient.post(`/payments/${paymentId}/confirm`),
  getPaymentStatus: (paymentId) => axiosClient.get(`/payments/${paymentId}/status`),
}
