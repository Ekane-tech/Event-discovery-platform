export const mockNotificationTemplates = [
  {
    id: 'technology-douala-tech-summit',
    type: 'interest_match',
    title: 'New Technology event in Douala',
    message: 'Douala Tech Summit matches your Technology interest.',
    category: 'Technology',
    city: 'Douala',
    region: 'Littoral',
    eventId: 1,
    createdAt: '2026-07-06T08:30:00',
  },
  {
    id: 'business-yaounde-forum',
    type: 'interest_match',
    title: 'Business event recommended for you',
    message: 'Yaoundé Business Forum matches your Business interest.',
    category: 'Business',
    city: 'Yaoundé',
    region: 'Centre',
    eventId: 2,
    createdAt: '2026-07-06T09:15:00',
  },
  {
    id: 'music-limbe-festival',
    type: 'interest_match',
    title: 'Music festival you may like',
    message: 'Limbe Music Festival matches your Music interest.',
    category: 'Music',
    city: 'Limbe',
    region: 'South-West',
    eventId: 3,
    createdAt: '2026-07-06T10:00:00',
  },
  {
    id: 'sports-douala-tournament',
    type: 'interest_match',
    title: 'Sports event near Douala',
    message: 'A football tournament has been added for Sports lovers.',
    category: 'Sports',
    city: 'Douala',
    region: 'Littoral',
    eventId: null,
    createdAt: '2026-07-06T11:20:00',
  },
  {
    id: 'culture-bamenda-festival',
    type: 'interest_match',
    title: 'Cultural event recommendation',
    message: 'A new cultural festival matches your Culture interest.',
    category: 'Culture',
    city: 'Bamenda',
    region: 'North-West',
    eventId: null,
    createdAt: '2026-07-06T12:05:00',
  },
  {
    id: 'education-career-workshop',
    type: 'interest_match',
    title: 'Education workshop available',
    message: 'A career workshop matches your Education interest.',
    category: 'Education',
    city: 'Buea',
    region: 'South-West',
    eventId: null,
    createdAt: '2026-07-06T13:10:00',
  },
  {
    id: 'profile-complete-interests',
    type: 'system',
    title: 'Complete your interests',
    message: 'Select your interests so we can notify you about relevant events.',
    category: null,
    city: null,
    region: null,
    eventId: null,
    createdAt: '2026-07-06T07:00:00',
  },
  {
    id: 'registration-reminder-demo',
    type: 'reminder',
    title: 'Event reminder example',
    message: 'Event reminders will appear here after you register for events.',
    category: null,
    city: null,
    region: null,
    eventId: null,
    createdAt: '2026-07-05T16:45:00',
  },
]

export function createNotificationsForInterests(selectedInterests = []) {
  const selectedCategoryNames = selectedInterests.map((interest) => interest.name)
  const hasSelectedInterests = selectedCategoryNames.length > 0

  return mockNotificationTemplates.filter((notification) => {
    if (notification.type === 'system') {
      return !hasSelectedInterests
    }

    if (notification.type === 'reminder') {
      return true
    }

    return selectedCategoryNames.includes(notification.category)
  })
}
