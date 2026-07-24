import { describe, expect, it } from 'vitest'
import { computeMonthlySchedule } from './monthlySchedule'
import { computeVehicleResult } from './calculations'
import type {
  CashFinancing,
  CostBreakdown,
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

function sumSchedule(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number) {
  const years = computeMonthlySchedule(vehicle, holdingYears, annualMileageKm)
  const empty: CostBreakdown = { financement: 0, energie: 0, entretien: 0, pneus: 0, assurance: 0, fiscalite: 0 }
  const breakdown = years.reduce(
    (acc, y) => ({
      financement: acc.financement + y.breakdown.financement,
      energie: acc.energie + y.breakdown.energie,
      entretien: acc.entretien + y.breakdown.entretien,
      pneus: acc.pneus + y.breakdown.pneus,
      assurance: acc.assurance + y.breakdown.assurance,
      fiscalite: acc.fiscalite + y.breakdown.fiscalite,
    }),
    empty,
  )
  const totalCost = years.reduce((sum, y) => sum + y.totalCost, 0)
  return { totalCost, breakdown, years }
}

describe('computeMonthlySchedule — parity with computeVehicleResult', () => {
  it('matches the aggregate total and breakdown for cash financing', () => {
    const vehicle = baseVehicle()
    const aggregate = computeVehicleResult(vehicle, 4, 10000)
    const { totalCost, breakdown } = sumSchedule(vehicle, 4, 10000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
    expect(breakdown.energie).toBeCloseTo(aggregate.breakdown.energie, 6)
    expect(breakdown.entretien).toBeCloseTo(aggregate.breakdown.entretien, 6)
    expect(breakdown.pneus).toBeCloseTo(aggregate.breakdown.pneus, 6)
    expect(breakdown.assurance).toBeCloseTo(aggregate.breakdown.assurance, 6)
    expect(breakdown.fiscalite).toBeCloseTo(aggregate.breakdown.fiscalite, 6)
  })

  it('matches the aggregate for credit financing paid off within the holding period', () => {
    const financing: CreditFinancing = {
      mode: 'credit',
      downPayment: 3000,
      annualInterestRatePct: 4,
      loanDurationMonths: 36,
      carteGriseCost: 200,
      resaleValueAtEnd: 9000,
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 5, 12000)
    const { totalCost, breakdown } = sumSchedule(vehicle, 5, 12000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
  })

  it('matches the aggregate for credit financing not paid off by the end of the holding period', () => {
    const financing: CreditFinancing = {
      mode: 'credit',
      downPayment: 2000,
      annualInterestRatePct: 5,
      loanDurationMonths: 72,
      carteGriseCost: 200,
      resaleValueAtEnd: 9000,
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 4, 12000) // 48 months held, 72-month loan
    const { totalCost, breakdown } = sumSchedule(vehicle, 4, 12000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
  })

  it('matches the aggregate for LOA with a buyout that lands exactly on a contract boundary', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 2000,
      monthlyPayment: 300,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 12000,
      excessMileageCostPerKm: 0.08,
      underMileageRefundPerKm: 0,
      restitutionFees: 150,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'buyout',
      buybackValue: 9000,
      estimatedResaleValueAfterBuyout: 8000,
      autoCalculate: false,
      annualInterestRatePct: 4,
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 3, 15000) // 36 months = exactly one contract
    const { totalCost, breakdown } = sumSchedule(vehicle, 3, 15000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
  })

  it('matches the aggregate for LOA with a mid-holding buyout (contract shorter than the holding period)', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 2000,
      monthlyPayment: 300,
      contractDurationMonths: 37,
      contractualAnnualMileageKm: 12000,
      excessMileageCostPerKm: 0.08,
      underMileageRefundPerKm: 0,
      restitutionFees: 150,
      maintenanceIncluded: true,
      insuranceIncluded: true,
      endOfContractAction: 'buyout',
      buybackValue: 9000,
      estimatedResaleValueAfterBuyout: 8000,
      autoCalculate: false,
      annualInterestRatePct: 4,
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 4, 18000) // 48 months: 37-month contract, then 11 months owned outright
    const { totalCost, breakdown } = sumSchedule(vehicle, 4, 18000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
    expect(breakdown.entretien).toBeCloseTo(aggregate.breakdown.entretien, 6)
    expect(breakdown.assurance).toBeCloseTo(aggregate.breakdown.assurance, 6)
  })

  it('matches the aggregate for LOA with a buyout requested but the contract never finishes within the holding period', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 2000,
      monthlyPayment: 300,
      contractDurationMonths: 48,
      contractualAnnualMileageKm: 12000,
      excessMileageCostPerKm: 0.08,
      underMileageRefundPerKm: 0,
      restitutionFees: 150,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'buyout',
      buybackValue: 9000,
      estimatedResaleValueAfterBuyout: 8000,
      autoCalculate: false,
      annualInterestRatePct: 4,
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 3, 18000) // 36 months held, 48-month contract never finishes
    const { totalCost, breakdown } = sumSchedule(vehicle, 3, 18000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
  })

  it('matches the aggregate for LOA renewed across multiple contracts, with the first payment on each contract start', () => {
    const financing: LoaFinancing = {
      mode: 'loa',
      firstPayment: 1500,
      monthlyPayment: 280,
      contractDurationMonths: 24,
      contractualAnnualMileageKm: 12000,
      excessMileageCostPerKm: 0.08,
      underMileageRefundPerKm: 0,
      restitutionFees: 150,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'renew',
      buybackValue: 9000,
      estimatedResaleValueAfterBuyout: 8000,
      autoCalculate: false,
      annualInterestRatePct: 4,
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 5, 12000) // 60 months / 24-month contracts = 3 contracts
    const { totalCost, breakdown, years } = sumSchedule(vehicle, 5, 12000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
    // firstPayment lands on the first month of contracts starting at month 1, 25 and 49.
    expect(years[0].months[0].breakdown.financement).toBeCloseTo(1500 + 280, 6)
    expect(years[2].months[0].breakdown.financement).toBeCloseTo(1500 + 280, 6)
    expect(years[4].months[0].breakdown.financement).toBeCloseTo(1500 + 280, 6)
  })

  it('matches the aggregate for LDD with maintenance and insurance included in the lease', () => {
    const financing: LddFinancing = {
      mode: 'ldd',
      firstPayment: 1000,
      monthlyPayment: 320,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 12000,
      excessMileageCostPerKm: 0.09,
      underMileageRefundPerKm: 0,
      restitutionFees: 150,
      maintenanceIncluded: true,
      insuranceIncluded: true,
      endOfContractAction: 'return',
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 3, 12000)
    const { totalCost, breakdown } = sumSchedule(vehicle, 3, 12000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.entretien).toBe(0)
    expect(breakdown.assurance).toBe(0)
    expect(aggregate.breakdown.entretien).toBe(0)
    expect(aggregate.breakdown.assurance).toBe(0)
  })

  it('books the excess-mileage adjustment on the very last month for LOA/LDD', () => {
    const financing: LddFinancing = {
      mode: 'ldd',
      firstPayment: 1000,
      monthlyPayment: 320,
      contractDurationMonths: 36,
      contractualAnnualMileageKm: 10000,
      excessMileageCostPerKm: 0.1,
      underMileageRefundPerKm: 0,
      restitutionFees: 150,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      endOfContractAction: 'return',
    }
    const vehicle = baseVehicle({ financing })
    const aggregate = computeVehicleResult(vehicle, 3, 15000) // well above the 10 000 km/an forfait
    const { totalCost, breakdown, years } = sumSchedule(vehicle, 3, 15000)

    expect(totalCost).toBeCloseTo(aggregate.totalCost, 6)
    expect(breakdown.financement).toBeCloseTo(aggregate.breakdown.financement, 6)
    const lastMonth = years[years.length - 1].months[11]
    expect(lastMonth.breakdown.financement).toBeGreaterThan(320) // monthly payment + restitution + mileage spike
  })
})

describe('computeMonthlySchedule — tire replacement timing', () => {
  it('places a tire replacement on the month cumulative mileage first crosses the lifespan threshold', () => {
    const vehicle = baseVehicle({ tireLifespanKm: 20000, tireSetPrice: 400 })
    // 10 000 km/an → the 20 000 km threshold is reached exactly at month 24.
    const years = computeMonthlySchedule(vehicle, 3, 10000)
    const pneusMonths = years.flatMap((y) => y.months).filter((m) => m.breakdown.pneus > 0)

    expect(pneusMonths).toHaveLength(1)
    expect(pneusMonths[0].month).toBe(24)
    expect(pneusMonths[0].breakdown.pneus).toBeCloseTo(400, 6)
  })

  it('does not throw and produces no tire cost when annual mileage is zero', () => {
    const vehicle = baseVehicle()
    expect(() => computeMonthlySchedule(vehicle, 3, 0)).not.toThrow()
    const totalPneus = computeMonthlySchedule(vehicle, 3, 0).reduce((sum, y) => sum + y.breakdown.pneus, 0)
    expect(totalPneus).toBe(0)
  })
})

describe('computeMonthlySchedule — energy smoothing and inflation', () => {
  it('smooths each year total evenly across its 12 months and applies inflation year over year', () => {
    const vehicle = baseVehicle({
      energy: { consumptionL100km: 5, fuelPricePerLiter: 2, annualPriceInflationPct: 10 },
    })
    const years = computeMonthlySchedule(vehicle, 2, 10000)

    const year1Monthly = years[0].months[0].breakdown.energie
    const year2Monthly = years[1].months[0].breakdown.energie
    expect(year2Monthly).toBeCloseTo(year1Monthly * 1.1, 6)
    expect(years[0].months.every((m) => m.breakdown.energie === year1Monthly)).toBe(true)
  })
})
