import axiosClient from '../../../shared/api/axiosClient.js'
import { API_ENDPOINTS } from '../../../shared/api/apiEndpoints.js'

export const authService = {
  login: (payload) => axiosClient.post(API_ENDPOINTS.login, payload),
  register: (payload) => axiosClient.post(API_ENDPOINTS.register, payload),
  logout: () => axiosClient.post(API_ENDPOINTS.logout),
  me: () => axiosClient.get(API_ENDPOINTS.me),
  forgotPassword: (payload) => axiosClient.post(API_ENDPOINTS.forgotPassword, payload),
  resetPassword: (payload) => axiosClient.post(API_ENDPOINTS.resetPassword, payload),
  changePassword: (payload) => axiosClient.put(API_ENDPOINTS.changePassword, payload),
}
