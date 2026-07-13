export function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-CM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
