export function formatPrice(amount) {
  if (Number(amount) === 0) return 'Free'

  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}
