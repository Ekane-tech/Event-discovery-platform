import axiosClient from '../../../shared/api/axiosClient.js'

export const interestService = {
  getInterests: () => axiosClient.get('/interests'),
  getMyInterests: () => axiosClient.get('/me/interests'),
  syncMyInterests: (interestIds) => axiosClient.post('/me/interests', {
    interest_ids: interestIds,
  }),
}
