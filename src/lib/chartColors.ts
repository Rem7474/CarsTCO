import type { CostCategory } from '../types/scenario'

/** Fixed hue order — a category's color never changes based on rank or value. */
export const CATEGORY_COLORS: Record<CostCategory, string> = {
  financement: 'var(--series-1)',
  energie: 'var(--series-2)',
  entretien: 'var(--series-3)',
  pneus: 'var(--series-4)',
  assurance: 'var(--series-7)',
  fiscalite: 'var(--series-8)',
}

export const CATEGORY_LABELS: Record<CostCategory, string> = {
  financement: 'Financement net',
  energie: 'Énergie',
  entretien: 'Entretien',
  pneus: 'Pneus',
  assurance: 'Assurance',
  fiscalite: 'Fiscalité',
}

export const CATEGORY_ORDER: CostCategory[] = [
  'financement',
  'energie',
  'entretien',
  'pneus',
  'assurance',
  'fiscalite',
]

/**
 * Vehicle identity colors, assigned by position (1st vehicle added, 2nd, ...) and fixed
 * regardless of which one is cheapest. Same validated adjacent-pair order as the category
 * palette; a comparison beyond 8 vehicles would need a new set, which is why the UI caps
 * the vehicle count (see MAX_VEHICLES).
 */
export const VEHICLE_COLORS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
  'var(--series-8)',
]

export function getVehicleColor(index: number): string {
  return VEHICLE_COLORS[index % VEHICLE_COLORS.length]
}
