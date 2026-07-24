const DAY_IN_MS = 24 * 60 * 60 * 1000

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getEventEffectiveEndDate(event) {
  return parseDate(event?.endDate || event?.end_date || event?.startDate || event?.start_date)
}

export function hasEventEnded(event, referenceDate = new Date()) {
  const effectiveEndDate = getEventEffectiveEndDate(event)
  return Boolean(effectiveEndDate && effectiveEndDate.getTime() < referenceDate.getTime())
}

export function getEventLifecycle(event, referenceDate = new Date()) {
  const startDate = parseDate(event?.startDate || event?.start_date)
  const endDate = getEventEffectiveEndDate(event)
  const registrationDeadline = parseDate(event?.registrationDeadline || event?.registration_deadline)
  const nowTime = referenceDate.getTime()
  const startTime = startDate?.getTime()
  const endTime = endDate?.getTime()
  const deadlineTime = registrationDeadline?.getTime()
  const isPast = Boolean(endTime && endTime < nowTime)
  const isOngoing = Boolean(startTime && endTime && startTime <= nowTime && nowTime <= endTime)
  const registrationDeadlinePassed = Boolean(deadlineTime && deadlineTime < nowTime)
  const registrationDeadlineUrgent = Boolean(
    !isPast
      && deadlineTime
      && deadlineTime >= nowTime
      && deadlineTime - nowTime <= DAY_IN_MS
  )

  return {
    isPast,
    isOngoing,
    isUpcoming: Boolean(startTime && startTime > nowTime),
    registrationDeadlineUrgent,
    registrationDeadlinePassed,
    hoursToRegistrationDeadline: registrationDeadlineUrgent ? Math.max(0, Math.ceil((deadlineTime - nowTime) / (60 * 60 * 1000))) : null,
    effectiveEndDate: endDate,
  }
}
