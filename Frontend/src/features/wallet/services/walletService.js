import axiosClient from '../../../shared/api/axiosClient.js'

// Organizer wallet & payouts (see backend WalletController).
export const walletService = {
  getWallet: () => axiosClient.get('/wallet'),
  getTransactions: (params = {}) => axiosClient.get('/wallet/transactions', { params }),
  updatePayoutMethod: (payload) => axiosClient.put('/wallet/payout-method', payload),
  getPayouts: (params = {}) => axiosClient.get('/wallet/payouts', { params }),
  requestPayout: (payload) => axiosClient.post('/wallet/payouts', payload),
  cancelPayout: (payoutId) => axiosClient.post(`/wallet/payouts/${payoutId}/cancel`),
}
