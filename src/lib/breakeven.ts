import { computeVehicleResult } from './calculations'
import type { ScenarioConfig } from '../types/scenario'

export interface MileagePoint {
  annualMileageKm: number
  totalCostA: number
  totalCostB: number
}

/**
 * Total cost of each vehicle across a range of annual mileage values, holding
 * the holding period fixed. Used to find the mileage at which one vehicle
 * becomes cheaper than the other.
 */
export function computeCostByMileage(
  scenario: ScenarioConfig,
  minKm = 5000,
  maxKm = 30000,
  stepKm = 1000,
): MileagePoint[] {
  const points: MileagePoint[] = []
  for (let km = minKm; km <= maxKm; km += stepKm) {
    const resultA = computeVehicleResult(scenario.vehicleA, scenario.holdingYears, km)
    const resultB = computeVehicleResult(scenario.vehicleB, scenario.holdingYears, km)
    points.push({ annualMileageKm: km, totalCostA: resultA.totalCost, totalCostB: resultB.totalCost })
  }
  return points
}

export interface DurationPoint {
  years: number
  totalCostA: number
  totalCostB: number
}

/**
 * Total cost of each vehicle across a range of holding durations, holding
 * annual mileage fixed. Used to see cumulative cost evolve over time.
 */
export function computeCostByDuration(scenario: ScenarioConfig, maxYears = 10): DurationPoint[] {
  const points: DurationPoint[] = []
  for (let years = 1; years <= maxYears; years++) {
    const resultA = computeVehicleResult(scenario.vehicleA, years, scenario.annualMileageKm)
    const resultB = computeVehicleResult(scenario.vehicleB, years, scenario.annualMileageKm)
    points.push({ years, totalCostA: resultA.totalCost, totalCostB: resultB.totalCost })
  }
  return points
}

export interface BreakEvenResult {
  /** Annual mileage at which the two vehicles cost the same, if within the analyzed range. */
  crossoverMileageKm: number | null
  cheaperBelowCrossover: 'A' | 'B' | null
}

export function findMileageCrossover(points: MileagePoint[]): BreakEvenResult {
  if (points.length < 2) return { crossoverMileageKm: null, cheaperBelowCrossover: null }

  const firstDiff = points[0].totalCostA - points[0].totalCostB
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].totalCostA - points[i].totalCostB
    const prevDiff = points[i - 1].totalCostA - points[i - 1].totalCostB
    if (Math.sign(diff) !== Math.sign(prevDiff) && diff !== prevDiff) {
      // Linear interpolation between the two points for a more precise crossover.
      const p0 = points[i - 1]
      const p1 = points[i]
      const d0 = p0.totalCostA - p0.totalCostB
      const d1 = p1.totalCostA - p1.totalCostB
      const t = d0 / (d0 - d1)
      const crossoverMileageKm = p0.annualMileageKm + t * (p1.annualMileageKm - p0.annualMileageKm)
      return {
        crossoverMileageKm: Math.round(crossoverMileageKm),
        cheaperBelowCrossover: firstDiff <= 0 ? 'A' : 'B',
      }
    }
  }
  return { crossoverMileageKm: null, cheaperBelowCrossover: null }
}
