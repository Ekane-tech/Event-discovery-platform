import axiosClient from '../../../shared/api/axiosClient.js'

export const categoryService = {
  getCategories: (params = {}) => axiosClient.get('/categories', { params }),
}
