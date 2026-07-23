import { describe, expect, it } from 'vitest'
import { computeVehicleResult } from './calculations'
import type {
  CashFinancing,
  CreditFinancing,
  LddFinancing,
  LoaFinancing,
  ThermalEnergyConfig,
  VehicleConfig,
} from '../types/scenario'

function baseVehicle(overrides: Partial<VehicleConfig> = {}): VehicleConfig {
  const financing: CashFinancing = { mode: 'cash', carteGriseCost: 200, resaleValueAtEnd: 8000 }
  const energy: ThermalEnergyConfig = {
    consumptionL100km: 5,
    fuelPricePerLiter: 2,
    annualPriceInflationPct: 0,
  }
  return {
    id: 'v',
    label: 'Test',
    energyType: 'thermal',
    purchasePrice: 20000,
    financing,
    energy,
    maintenanceAnnualCost: 500,
    tireSetPrice: 400,
    tireLifespanKm: 20000,
    insuranceAnnualPremium: 600,
    fiscal: { malus: 100, bonus: 0 },
    ...overrides,
  }
}

describe('computeVehicleResult — cash financing', () => {
  it('computes each cost bucket and the total for a simple scenario', () => {
    const vehicle = baseVehicle()
    const result = computeVehicleResult(vehicle, 4, 10000)

    expect(result.breakdown.financement).toBeCloseTo(20000 - 8000, 6) // purchase - resale
    expect(result.breakdown.fiscalite).toBeCloseTo(200 + 100 - 0, 6) // carte grise + malus - bonus
    expect(result.breakdown.energie).toBeCloseTo(4000, 6) // 500L/an * 2€/L * 4 ans, no inflation
    expect(result.breakdown.entretien).toBeCloseTo(2000, 6) // 500€/an * 4
    expect(result.breakdown.pneus).toBeCloseTo(800, 6) // floor(40000/20000) * 400€
    expect(result.breakdown.assurance).toBeCloseTo(2400, 6) // 600€/an * 4

    expect(result.totalCost).toBeCloseTo(21500, 6)
    expect(result.costPerMonth).toBeCloseTo(21500 / 48, 6)
    expect(result.costPerKm).toBeCloseTo(21500 / 40000, 6)
  })

  it('reports zero cost/km when total mileage is zero', () => {
    const result = computeVehicleResult(baseVehicle(), 3, 0)
    expect(result.costPerKm).toBe(0)
  })
})

describe('computeVehicleResult — credit financing', () => {
  it('at 0% interest, total financing cost is independent of loan duration vs holding period', () => {
    const financing: CreditFinancing = {
      mode: 'credit',
      downPayment: 5000,
      annualInterestRatePct: 0,
      loanDurationMonths: 48,
      carteGriseCost: 0,
      resaleValueAtEnd: 8000,
    }
    const vehicle = baseVehicle({ purchasePrice: 24000, financing, fiscal: { malus: 0, bonus: 0 } })

    // Loan fully repaid before the holding period ends.
    const paidOff = computeVehicleResult(vehicle, 5, 10000) // 60 months > 48
    // Loan still running when the holding period ends — remaining balance must be added.
    const stillOwing = computeVehicleResult(vehicle, 2, 10000) // 24 months < 48

    const expectedFinancement = 24000 - 8000 // purchase price - resale, since 0% interest
    expect(paidOff.breakdown.financement).toBeCloseTo(expectedFinancement, 6)
    expect(stillOwing.breakdown.financement).toBeCloseTo(expectedFinancement, 6)
  })

  it('adds a note and a positive remaining balance when the loan outlives the holding period', () => {
    const financing: CreditFinancing = {
      mode: 'credit',
      downPayment: 2000,
      annualInterestRatePct: 5,
      loanDurationMonths: 60,
      carteGriseCost: 100,
      resaleValueAtEnd: 5000,
    }
    const vehicle = baseVehicle({ purchasePrice: 22000, financing })
    const result = computeVehicleResult(vehicle, 2, 10000) // holding (24mo) << loan (60mo)

    expect(result.notes.some((n) => n.includes('solde restant dû'))).toBe(true)
    // With interest > 0 and an unpaid balance folded in, cost must exceed the naive purchase-resale figure.
    expect(result.breakdown.financement).toBeGreaterThan(22000 - 5000)
  })

  it('total financing cost increases with the interest rate, all else equal', () => {
    const build = (rate: number) => {
      const financing: CreditFinancing = {
        mode: 'credit',
        downPayment: 3000,
        annualInterestRatePct: rate,
        loanDurationMonths: 48,
        carteGriseCost: 0,
        resaleValueAtEnd: 6000,
      }
      return computeVehicleResult(baseVehicle({ purchasePrice: 20000, financing }), 4, 10000)
    }
    expect(build(8).breakdown.financement).toBeGreaterThan(build(2).breakdown.financement)
  })
})

describe('computeVehicleResult — LOA financing', () => {
  it('lifts the purchase option when the holding period ends exactly on a contract boundary', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 2000,
      monthlyPayment: 300,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 15000,
      excessMileageCostPerKm: 0.1,
      underMileageRefundPerKm: 0,
      restitutionFees: 250,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'buyout',
      buybackValue: 10000,
      estimatedResaleValueAfterBuyout: 9000,
    }
    const vehicle = baseVehicle({ financing })
    const result = computeVehicleResult(vehicle, 3, 15000) // 36 months, matches contract exactly

    // firstPayment + 36 monthly payments + buyback - resale-after-buyout, no mileage excess (usage == contractual)
    expect(result.breakdown.financement).toBeCloseTo(2000 + 300 * 36 + 10000 - 9000, 6)
    expect(result.notes.some((n) => n.includes("levée en fin de contrat"))).toBe(true)
    expect(result.breakdown.fiscalite).toBe(0)
  })

  it('falls back to restitution fees when a buyout is requested off a contract boundary', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 2000,
      monthlyPayment: 300,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 15000,
      excessMileageCostPerKm: 0.1,
      underMileageRefundPerKm: 0,
      restitutionFees: 250,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'buyout',
      buybackValue: 10000,
      estimatedResaleValueAfterBuyout: 9000,
    }
    const vehicle = baseVehicle({ financing })
    const result = computeVehicleResult(vehicle, 4, 15000) // 48 months: 2 contracts, remainder 12mo

    expect(result.breakdown.financement).toBeCloseTo(2000 * 2 + 300 * 48 + 250, 6)
    expect(result.notes.some((n) => n.includes('rachat non applicable'))).toBe(true)
  })

  it('charges for mileage driven beyond the contractual allowance', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 0,
      monthlyPayment: 0,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 10000,
      excessMileageCostPerKm: 0.1,
      underMileageRefundPerKm: 0,
      restitutionFees: 0,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'return',
      buybackValue: 0,
      estimatedResaleValueAfterBuyout: 0,
    }
    const vehicle = baseVehicle({ financing })
    const result = computeVehicleResult(vehicle, 3, 15000) // 5,000 km/an over contract for 3 years

    expect(result.breakdown.financement).toBeCloseTo(15000 * 0.1, 6) // 15,000 excess km * 0.1€/km
  })
})

describe('computeVehicleResult — LDD financing', () => {
  it('zeroes out maintenance and insurance when included in the lease payment', () => {
    const financing: LddFinancing = {
      mode: 'ldd',
      firstPayment: 1000,
      monthlyPayment: 250,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 12000,
      excessMileageCostPerKm: 0.09,
      underMileageRefundPerKm: 0,
      restitutionFees: 0,
      maintenanceIncluded: true,
      insuranceIncluded: true,
      endOfContractAction: 'renew',
    }
    const vehicle = baseVehicle({ financing })
    const result = computeVehicleResult(vehicle, 3, 12000)

    expect(result.breakdown.entretien).toBe(0)
    expect(result.breakdown.assurance).toBe(0)
    expect(result.notes.some((n) => n.includes('Entretien inclus'))).toBe(true)
    expect(result.notes.some((n) => n.includes('Assurance incluse'))).toBe(true)
  })
})

describe('computeVehicleResult — energy cost', () => {
  it('compounds fuel price inflation year over year for thermal vehicles', () => {
    const energy: ThermalEnergyConfig = {
      consumptionL100km: 5,
      fuelPricePerLiter: 2,
      annualPriceInflationPct: 10,
    }
    const vehicle = baseVehicle({ energy })
    const result = computeVehicleResult(vehicle, 3, 10000)

    // Year 1: 1000€, year 2: 1100€, year 3: 1210€
    expect(result.breakdown.energie).toBeCloseTo(1000 + 1100 + 1210, 6)
  })

  it('splits electric charging cost between home and public rates', () => {
    const vehicle = baseVehicle({
      energyType: 'electric',
      energy: {
        consumptionKwh100km: 15,
        homePricePerKwh: 0.15,
        publicPricePerKwh: 0.4,
        homeChargeSharePct: 70,
        annualPriceInflationPct: 0,
      },
    })
    const result = computeVehicleResult(vehicle, 1, 12000)

    // 1800 kWh total: 1260 kWh @ 0.15€ + 540 kWh @ 0.40€
    expect(result.breakdown.energie).toBeCloseTo(1260 * 0.15 + 540 * 0.4, 6)
  })
})

describe('computeVehicleResult — tires', () => {
  it('only counts a replacement once the tire lifespan is fully used up', () => {
    const vehicle = baseVehicle({ tireSetPrice: 400, tireLifespanKm: 20000 })
    const justUnder = computeVehicleResult(vehicle, 1, 19999)
    const exact = computeVehicleResult(vehicle, 1, 20000)
    const threeSets = computeVehicleResult(vehicle, 3, 20000)

    expect(justUnder.breakdown.pneus).toBe(0)
    expect(exact.breakdown.pneus).toBe(400)
    expect(threeSets.breakdown.pneus).toBe(1200)
  })
})
