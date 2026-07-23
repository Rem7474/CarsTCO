import { describe, expect, it } from 'vitest'
import { computeCostByDuration, computeCostByMileage, findMileageCrossover, type MileagePoint } from './breakeven'
import { computeVehicleResult } from './calculations'
import { createDefaultScenario } from '../data/defaults'

describe('findMileageCrossover', () => {
  it('finds the interpolated mileage where the cheaper vehicle flips', () => {
    const points: MileagePoint[] = [
      { annualMileageKm: 5000, totalCostA: 100, totalCostB: 200 },
      { annualMileageKm: 10000, totalCostA: 150, totalCostB: 180 },
      { annualMileageKm: 15000, totalCostA: 200, totalCostB: 160 },
    ]
    const result = findMileageCrossover(points)

    expect(result.cheaperBelowCrossover).toBe('A')
    expect(result.crossoverMileageKm).toBe(12143)
  })

  it('returns null when one vehicle stays cheaper across the whole range', () => {
    const points: MileagePoint[] = [
      { annualMileageKm: 5000, totalCostA: 100, totalCostB: 300 },
      { annualMileageKm: 10000, totalCostA: 150, totalCostB: 320 },
      { annualMileageKm: 15000, totalCostA: 200, totalCostB: 340 },
    ]
    const result = findMileageCrossover(points)

    expect(result.crossoverMileageKm).toBeNull()
    expect(result.cheaperBelowCrossover).toBeNull()
  })
})

describe('computeCostByMileage', () => {
  it('matches computeVehicleResult at each sampled mileage point', () => {
    const scenario = createDefaultScenario()
    const points = computeCostByMileage(scenario, 5000, 15000, 5000)

    expect(points.map((p) => p.annualMileageKm)).toEqual([5000, 10000, 15000])
    for (const p of points) {
      const expectedA = computeVehicleResult(scenario.vehicleA, scenario.holdingYears, p.annualMileageKm)
      const expectedB = computeVehicleResult(scenario.vehicleB, scenario.holdingYears, p.annualMileageKm)
      expect(p.totalCostA).toBeCloseTo(expectedA.totalCost, 6)
      expect(p.totalCostB).toBeCloseTo(expectedB.totalCost, 6)
    }
  })
})

describe('computeCostByDuration', () => {
  it('matches computeVehicleResult at each sampled year', () => {
    const scenario = createDefaultScenario()
    const points = computeCostByDuration(scenario, 3)

    expect(points.map((p) => p.years)).toEqual([1, 2, 3])
    for (const p of points) {
      const expectedA = computeVehicleResult(scenario.vehicleA, p.years, scenario.annualMileageKm)
      expect(p.totalCostA).toBeCloseTo(expectedA.totalCost, 6)
    }
  })
})
