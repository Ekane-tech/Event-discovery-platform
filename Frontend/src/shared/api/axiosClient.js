import axios from 'axios'
import { API_BASE_URL } from '../constants/app.js'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 403 && error?.response?.data?.email_verification_required) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/verify-email')) {
        window.location.assign('/verify-email?status=required')
      }
    }

    return Promise.reject(error)
  },
)

export default axiosClient
