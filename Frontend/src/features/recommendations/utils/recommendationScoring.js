export function getUniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))]
}

export function calculateRecommendation(event, context) {
  const reasons = []
  let score = 0

  const selectedInterestNames = context.selectedInterests.map((interest) => interest.name)
  const bookmarkedCategories = getUniqueValues(context.bookmarkedEvents.map((item) => item.category))
  const registeredCategories = getUniqueValues(context.registeredEvents.map((item) => item.category))
  const bookmarkedOrganizers = getUniqueValues(context.bookmarkedEvents.map((item) => item.organizer))
  const registeredOrganizers = getUniqueValues(context.registeredEvents.map((item) => item.organizer))

  if (selectedInterestNames.includes(event.category)) {
    score += 50
    reasons.push(`Matches your ${event.category} interest`)
  }

  if (bookmarkedCategories.includes(event.category)) {
    score += 25
    reasons.push(`Similar to events you saved`)
  }

  if (registeredCategories.includes(event.category)) {
    score += 35
    reasons.push(`Similar to events you registered for`)
  }

  if (bookmarkedOrganizers.includes(event.organizer) || registeredOrganizers.includes(event.organizer)) {
    score += 20
    reasons.push(`From an organizer you interacted with`)
  }

  if (context.user?.region && event.region === context.user.region) {
    score += 20
    reasons.push(`Near your region: ${event.region}`)
  }

  if (context.user?.city && event.city === context.user.city) {
    score += 15
    reasons.push(`In your city: ${event.city}`)
  }

  if (Number(event.price) === 0) {
    score += 5
    reasons.push('Free event')
  }

  const popularityScore = Math.round(Number(event.popularity || 0) / 10)
  score += popularityScore

  if (Number(event.popularity || 0) >= 80) {
    reasons.push('Popular event')
  }

  const eventDate = new Date(event.startDate)
  const now = new Date()

  if (eventDate >= now) {
    score += 10
    reasons.push('Upcoming event')
  }

  return {
    ...event,
    recommendationScore: Math.min(100, score),
    recommendationReasons: getUniqueValues(reasons).slice(0, 4),
  }
}
