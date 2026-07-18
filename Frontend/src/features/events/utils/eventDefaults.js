export const EVENT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
]

export const EVENT_VISIBILITIES = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

export function createEmptyEventForm() {
  return {
    title: '',
    description: '',
    category_id: '',
    region_id: '',
    city_id: '',
    venue: '',
    startDate: '',
    endDate: '',
    price: '0',
    ticketTypes: [
      { name: 'Classic', description: 'Standard access', price: '0', quantity: '', is_active: true },
    ],
    maximumParticipants: '100',
    registrationDeadline: '',
    visibility: 'public',
    coverImage: null,
    galleryImages: [],
  }
}
