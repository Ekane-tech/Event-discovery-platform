import axiosClient from '../../../shared/api/axiosClient.js'

export const locationService = {
  getRegions: (params = {}) => axiosClient.get('/regions', { params }),
  getDivisions: (params = {}) => axiosClient.get('/divisions', { params }),
  getCities: (params = {}) => axiosClient.get('/cities', { params }),
}
