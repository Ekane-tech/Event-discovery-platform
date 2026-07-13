import axiosClient from '../../../shared/api/axiosClient.js'

export const ticketService = {
  verifyTicket: (ticketNumber) => axiosClient.get(`/tickets/verify/${encodeURIComponent(ticketNumber)}`),
}
