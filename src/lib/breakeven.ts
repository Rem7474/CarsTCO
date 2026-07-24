import { computeVehicleResult } from './calculations'
import { computeMonthlySchedule } from './monthlySchedule'
import type { ScenarioConfig } from '../types/scenario'

export interface MileagePoint {
  annualMileageKm: number
  /** Total cost per vehicle, aligned by index with scenario.vehicles. */
  costs: number[]
}

/**
 * Total cost of each vehicle across a range of annual mileage values, holding
 * the holding period fixed. Used to find the mileage at which the cheapest
 * vehicle changes.
 */
export function computeCostByMileage(
  scenario: ScenarioConfig,
  minKm = 5000,
  maxKm = 30000,
  stepKm = 1000,
): MileagePoint[] {
  const points: MileagePoint[] = []
  for (let km = minKm; km <= maxKm; km += stepKm) {
    const costs = scenario.vehicles.map(
      (vehicle) => computeVehicleResult(vehicle, scenario.holdingYears, km).totalCost,
    )
    points.push({ annualMileageKm: km, costs })
  }
  return points
}

export interface DurationPoint {
  years: number
  /** Total cost per vehicle, aligned by index with scenario.vehicles. */
  costs: number[]
}

/**
 * Cumulative cost of each vehicle, year by year, while actually holding it for the
 * scenario's configured duration — the running total of the same cash-flow schedule
 * the "Dépenses détaillées par année" table shows, not an independent re-simulation
 * of "what if I only held it for N years". The two would otherwise disagree for LOA
 * financing: computeVehicleResult(vehicle, N, ...) for N shorter than the contract
 * treats it as an early termination (restitution fees, no buyout), which isn't what's
 * actually happening at year N of a longer, ongoing lease.
 */
export function computeCostByDuration(scenario: ScenarioConfig): DurationPoint[] {
  const schedules = scenario.vehicles.map((vehicle) =>
    computeMonthlySchedule(vehicle, scenario.holdingYears, scenario.annualMileageKm),
  )
  const points: DurationPoint[] = []
  for (let year = 1; year <= scenario.holdingYears; year++) {
    const costs = schedules.map((schedule) => schedule[year - 1].cumulativeTotalCost)
    points.push({ years: year, costs })
  }
  return points
}

function argmin(values: number[]): number {
  let best = 0
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[best]) best = i
  }
  return best
}

export interface LeadershipSegment {
  /** Start of the range (inclusive) where `cheapestIndex` is the cheapest vehicle. */
  fromKm: number
  /** End of the range (inclusive), or null if this segment runs to the end of the analyzed range. */
  toKm: number | null
  cheapestIndex: number
}

/**
 * Splits a mileage sweep into segments of "which vehicle is cheapest here", generalizing
 * the two-vehicle crossover point to N vehicles. A leadership change between two sampled
 * points is interpolated linearly between the outgoing and incoming leader's cost curves.
 */
export function computeLeadershipSegments(points: MileagePoint[]): LeadershipSegment[] {
  if (points.length === 0) return []

  const segments: LeadershipSegment[] = []
  let currentLeader = argmin(points[0].costs)
  let segmentStart = points[0].annualMileageKm

  for (let i = 1; i < points.length; i++) {
    const leader = argmin(points[i].costs)
    if (leader !== currentLeader) {
      const p0 = points[i - 1]
      const p1 = points[i]
      const d0 = p0.costs[currentLeader] - p0.costs[leader]
      const d1 = p1.costs[currentLeader] - p1.costs[leader]
      const t = d1 === d0 ? 0.5 : d0 / (d0 - d1)
      const crossoverKm = Math.round(p0.annualMileageKm + t * (p1.annualMileageKm - p0.annualMileageKm))

      segments.push({ fromKm: segmentStart, toKm: crossoverKm, cheapestIndex: currentLeader })
      segmentStart = crossoverKm
      currentLeader = leader
    }
  }

  segments.push({ fromKm: segmentStart, toKm: null, cheapestIndex: currentLeader })
  return segments
}
