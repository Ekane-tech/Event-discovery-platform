import axiosClient from '../../../shared/api/axiosClient.js'

// Admin payouts & platform settings (see backend AdminPayoutController).
export const adminPayoutService = {
  getPayouts: (params = {}) => axiosClient.get('/admin/payouts', { params }),
  getPayout: (id) => axiosClient.get(`/admin/payouts/${id}`),
  approve: (id) => axiosClient.patch(`/admin/payouts/${id}/approve`),
  reject: (id, payload = {}) => axiosClient.patch(`/admin/payouts/${id}/reject`, payload),
  markPaid: (id, payload = {}) => axiosClient.patch(`/admin/payouts/${id}/mark-paid`, payload),
  getWallet: (userId) => axiosClient.get(`/admin/wallets/${userId}`),
  getSettings: () => axiosClient.get('/admin/platform-settings'),
  updateSettings: (payload) => axiosClient.put('/admin/platform-settings', payload),
}
