const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const currencyFormatterPrecise = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

export function formatEuro(value: number): string {
  return currencyFormatter.format(value)
}

export function formatEuroPrecise(value: number): string {
  return currencyFormatterPrecise.format(value)
}

export function formatKm(value: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(value))} km`
}
