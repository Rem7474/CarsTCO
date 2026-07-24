import { describe, expect, it } from 'vitest'
import { getVehicleWarnings } from './validation'
import { createDefaultElectricVehicle, createDefaultThermalVehicle } from '../data/defaults'
import type { CreditFinancing, LoaFinancing } from '../types/scenario'

const usage = { holdingYears: 5, annualMileageKm: 12000 }

describe('getVehicleWarnings', () => {
  it('returns no warnings for the untouched defaults', () => {
    expect(getVehicleWarnings(createDefaultThermalVehicle(), usage)).toEqual([])
    expect(getVehicleWarnings(createDefaultElectricVehicle(), usage)).toEqual([])
  })

  it('flags a resale value above the purchase price', () => {
    const vehicle = createDefaultThermalVehicle()
    ;(vehicle.financing as CreditFinancing).resaleValueAtEnd = vehicle.purchasePrice + 5000
    const warnings = getVehicleWarnings(vehicle, usage)
    expect(warnings.some((w) => w.includes('revente dépasse'))).toBe(true)
  })

  it('flags an unrealistic interest rate on credit', () => {
    const vehicle = createDefaultThermalVehicle()
    ;(vehicle.financing as CreditFinancing).annualInterestRatePct = 35
    const warnings = getVehicleWarnings(vehicle, usage)
    expect(warnings.some((w) => w.includes("taux d'intérêt"))).toBe(true)
  })

  it('flags a large mismatch between contractual and real mileage', () => {
    const vehicle = createDefaultElectricVehicle()
    const financing = vehicle.financing as LoaFinancing
    financing.contractualAnnualMileageKm = 8000
    // Not a buyout: the mileage check-out actually happens, so the mismatch matters.
    financing.endOfContractAction = 'return'
    const warnings = getVehicleWarnings(vehicle, { holdingYears: 5, annualMileageKm: 20000 })
    expect(warnings.some((w) => w.includes('dépasse largement le forfait'))).toBe(true)
  })

  it('does not flag a mileage mismatch when a buyout reaching the contract term waives the check-out', () => {
    const vehicle = createDefaultElectricVehicle()
    const financing = vehicle.financing as LoaFinancing
    financing.contractualAnnualMileageKm = 8000
    financing.endOfContractAction = 'buyout' // default already, kept explicit for clarity
    // holdingYears: 5 → 60 months > the 37-month contract: bought out mid-holding, never returned.
    const warnings = getVehicleWarnings(vehicle, { holdingYears: 5, annualMileageKm: 20000 })
    expect(warnings.some((w) => w.includes('dépasse largement le forfait'))).toBe(false)
  })

  it('flags a manual LOA rent far from the auto-calculated estimate', () => {
    const vehicle = createDefaultElectricVehicle()
    const financing = vehicle.financing as LoaFinancing
    financing.autoCalculate = false
    financing.monthlyPayment = 50 // way below a realistic estimate for a 38k€ car
    const warnings = getVehicleWarnings(vehicle, usage)
    expect(warnings.some((w) => w.includes('loyer saisi'))).toBe(true)
  })

  it('does not flag the manual rent when autoCalculate is on', () => {
    const vehicle = createDefaultElectricVehicle()
    const financing = vehicle.financing as LoaFinancing
    financing.autoCalculate = true
    financing.monthlyPayment = 50
    const warnings = getVehicleWarnings(vehicle, usage)
    expect(warnings.some((w) => w.includes('loyer saisi'))).toBe(false)
  })

  it('flags a suspiciously short tire lifespan', () => {
    const vehicle = createDefaultThermalVehicle()
    vehicle.tireLifespanKm = 2000
    const warnings = getVehicleWarnings(vehicle, usage)
    expect(warnings.some((w) => w.includes('pneus'))).toBe(true)
  })

  it('flags an out-of-range home charging share', () => {
    const vehicle = createDefaultElectricVehicle()
    if (vehicle.energyType === 'electric') {
      ;(vehicle.energy as { homeChargeSharePct: number }).homeChargeSharePct = 140
    }
    const warnings = getVehicleWarnings(vehicle, usage)
    expect(warnings.some((w) => w.includes('recharge à domicile'))).toBe(true)
  })
})
