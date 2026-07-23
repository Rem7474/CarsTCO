import { computeVehicleResult } from './calculations'
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
 * Total cost of each vehicle across a range of holding durations, holding
 * annual mileage fixed. Used to see cumulative cost evolve over time.
 */
export function computeCostByDuration(scenario: ScenarioConfig, maxYears = 10): DurationPoint[] {
  const points: DurationPoint[] = []
  for (let years = 1; years <= maxYears; years++) {
    const costs = scenario.vehicles.map(
      (vehicle) => computeVehicleResult(vehicle, years, scenario.annualMileageKm).totalCost,
    )
    points.push({ years, costs })
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
