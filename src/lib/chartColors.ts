import type { CostCategory, EnergyType, VehicleConfig } from '../types/scenario'

/** Fixed hue order — a category's color never changes based on rank or value. */
export const CATEGORY_COLORS: Record<CostCategory, string> = {
  financement: '#2F5D62',
  energie: '#DD5B33',
  entretien: '#C98A2C',
  pneus: '#8C8267',
  assurance: '#4C6B8A',
  fiscalite: '#8A4C6B',
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

/** Card chrome (header tint, border, heading color) — grouped by energy family, not identity. */
export const ENERGY_ACCENT: Record<EnergyType, { tint: string; border: string; deep: string; base: string; dark: string }> = {
  electric: { tint: '#E4F0EC', border: '#C7DED6', deep: '#123B32', base: '#0E6F5C', dark: '#0A5347' },
  thermal: { tint: '#FBE6DA', border: '#EAC5B0', deep: '#5C2B15', base: '#DD5B33', dark: '#9A4A28' },
}

/** Identity shade ramps within a energy family, so same-type vehicles stay distinguishable in dots/lines. */
const IDENTITY_RAMPS: Record<EnergyType, string[]> = {
  electric: ['#0E6F5C', '#1C8E76', '#0A5347'],
  thermal: ['#DD5B33', '#C9752E', '#9A4A28'],
}

/**
 * Per-vehicle identity color (ribbon dots, KPI cards, table headers, break-even chart lines).
 * Grouped by energy type (teal family for electric, coral family for thermal) with a shade
 * ramp so multiple vehicles of the same energy type stay distinguishable.
 */
export function getVehicleColor(vehicle: VehicleConfig, vehicles: VehicleConfig[]): string {
  const sameType = vehicles.filter((v) => v.energyType === vehicle.energyType)
  const idx = Math.max(0, sameType.findIndex((v) => v.id === vehicle.id))
  const ramp = IDENTITY_RAMPS[vehicle.energyType]
  return ramp[idx % ramp.length]
}
