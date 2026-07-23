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

/** Vehicle identity colors, fixed regardless of which one is cheaper. */
export const VEHICLE_COLOR_A = 'var(--series-1)'
export const VEHICLE_COLOR_B = 'var(--series-2)'
