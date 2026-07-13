import { useQuery } from '@tanstack/react-query'
import { eventService } from '../services/eventService.js'

export function useEvents(params) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const response = await eventService.getEvents(params)
      return response.data
    },
    enabled: false,
  })
}
