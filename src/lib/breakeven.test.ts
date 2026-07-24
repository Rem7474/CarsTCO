import { describe, expect, it } from 'vitest'
import { computeCostByDuration, computeCostByMileage, computeLeadershipSegments, type MileagePoint } from './breakeven'
import { computeVehicleResult } from './calculations'
import { computeMonthlySchedule } from './monthlySchedule'
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
    scenario.holdingYears = 3
    const points = computeCostByDuration(scenario)

    expect(points.map((p) => p.years)).toEqual([1, 2, 3])
    for (const p of points) {
      scenario.vehicles.forEach((vehicle, i) => {
        const schedule = computeMonthlySchedule(vehicle, scenario.holdingYears, scenario.annualMileageKm)
        expect(p.costs[i]).toBeCloseTo(schedule[p.years - 1].cumulativeTotalCost, 6)
      })
    }
    // The final point must also match the standalone aggregate for the full holding period.
    const last = points.at(-1)!
    scenario.vehicles.forEach((vehicle, i) => {
      const expected = computeVehicleResult(vehicle, scenario.holdingYears, scenario.annualMileageKm)
      expect(last.costs[i]).toBeCloseTo(expected.totalCost, 6)
    })
  })

  it('reflects the running cost of an ongoing LOA lease, not an independent early-termination scenario', () => {
    // A LOA contract longer than the elapsed year should NOT book restitution fees or an
    // early-termination penalty at intermediate years — the lease is simply still running.
    const scenario = createDefaultScenario()
    scenario.holdingYears = 5
    const electric = scenario.vehicles[1] // LOA, 37-month contract — longer than 1 year
    const points = computeCostByDuration(scenario)

    const year1Independent = computeVehicleResult(electric, 1, scenario.annualMileageKm).totalCost
    const year1Running = points[0].costs[1]

    // The independent 1-year simulation wrongly assumes the contract is being terminated
    // early (restitution fees); the running total from the actual multi-year lease doesn't.
    expect(year1Running).not.toBeCloseTo(year1Independent, 2)
    expect(year1Running).toBeCloseTo(
      computeMonthlySchedule(electric, scenario.holdingYears, scenario.annualMileageKm)[0].cumulativeTotalCost,
      6,
    )
  })
})
