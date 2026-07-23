import { describe, expect, it } from 'vitest'
import { computeCostByDuration, computeCostByMileage, computeLeadershipSegments, type MileagePoint } from './breakeven'
import { computeVehicleResult } from './calculations'
import { createDefaultScenario } from '../data/defaults'

describe('computeLeadershipSegments', () => {
  it('finds the interpolated mileage where the cheaper vehicle flips (2 vehicles)', () => {
    const points: MileagePoint[] = [
      { annualMileageKm: 5000, costs: [100, 200] },
      { annualMileageKm: 10000, costs: [150, 180] },
      { annualMileageKm: 15000, costs: [200, 160] },
    ]
    const segments = computeLeadershipSegments(points)

    expect(segments).toHaveLength(2)
    expect(segments[0]).toEqual({ fromKm: 5000, toKm: 12143, cheapestIndex: 0 })
    expect(segments[1]).toEqual({ fromKm: 12143, toKm: null, cheapestIndex: 1 })
  })

  it('returns a single segment when one vehicle stays cheaper across the whole range', () => {
    const points: MileagePoint[] = [
      { annualMileageKm: 5000, costs: [100, 300] },
      { annualMileageKm: 10000, costs: [150, 320] },
      { annualMileageKm: 15000, costs: [200, 340] },
    ]
    const segments = computeLeadershipSegments(points)

    expect(segments).toEqual([{ fromKm: 5000, toKm: null, cheapestIndex: 0 }])
  })

  it('handles more than two vehicles, producing multiple leadership changes', () => {
    const points: MileagePoint[] = [
      { annualMileageKm: 0, costs: [100, 150, 300] },
      { annualMileageKm: 10, costs: [200, 150, 300] },
      { annualMileageKm: 20, costs: [300, 250, 150] },
    ]
    const segments = computeLeadershipSegments(points)

    expect(segments.map((s) => s.cheapestIndex)).toEqual([0, 1, 2])
    expect(segments[0].fromKm).toBe(0)
    expect(segments.at(-1)!.toKm).toBeNull()
  })
})

describe('computeCostByMileage', () => {
  it('matches computeVehicleResult at each sampled mileage point, for every vehicle', () => {
    const scenario = createDefaultScenario()
    const points = computeCostByMileage(scenario, 5000, 15000, 5000)

    expect(points.map((p) => p.annualMileageKm)).toEqual([5000, 10000, 15000])
    for (const p of points) {
      scenario.vehicles.forEach((vehicle, i) => {
        const expected = computeVehicleResult(vehicle, scenario.holdingYears, p.annualMileageKm)
        expect(p.costs[i]).toBeCloseTo(expected.totalCost, 6)
      })
    }
  })
})

describe('computeCostByDuration', () => {
  it('matches computeVehicleResult at each sampled year, for every vehicle', () => {
    const scenario = createDefaultScenario()
    const points = computeCostByDuration(scenario, 3)

    expect(points.map((p) => p.years)).toEqual([1, 2, 3])
    for (const p of points) {
      scenario.vehicles.forEach((vehicle, i) => {
        const expected = computeVehicleResult(vehicle, p.years, scenario.annualMileageKm)
        expect(p.costs[i]).toBeCloseTo(expected.totalCost, 6)
      })
    }
  })
})
