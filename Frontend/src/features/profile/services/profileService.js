import axiosClient from '../../../shared/api/axiosClient.js'

export const profileService = {
  getProfile: () => axiosClient.get('/profile'),
  updateProfile: (payload) => axiosClient.put('/profile', payload),
  uploadAvatar: (formData) => axiosClient.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeAvatar: () => axiosClient.delete('/profile/avatar'),
}
