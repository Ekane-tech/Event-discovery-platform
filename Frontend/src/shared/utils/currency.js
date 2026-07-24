export function formatPrice(amount) {
  if (Number(amount) === 0) return 'Free'

  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Always format a money amount (never returns "Free"). Use this for
 * wallets/payouts/balances where 0 must show as a real figure.
 */
export function formatMoney(amount) {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}
