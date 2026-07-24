import type { CostBreakdown, ThermalEnergyConfig, VehicleConfig } from '../types/scenario'
import { computeLeaseMileageCost, isElectricEnergy, loanMonthlyPayment, loanRemainingBalance } from './calculations'
import { estimateLoaMonthlyPayment } from './loaEstimate'

export interface MonthlyCostEntry {
  /** 1-based month index over the whole holding period. */
  month: number
  /** 1-based year within the holding period. */
  year: number
  /** 1-based month within that year (1..12). */
  monthInYear: number
  breakdown: CostBreakdown
  totalCost: number
}

export interface YearlyCostEntry {
  year: number
  months: MonthlyCostEntry[]
  breakdown: CostBreakdown
  totalCost: number
  /** Running total from year 1 through this year — matches computeVehicleResult's totalCost once summed. */
  cumulativeTotalCost: number
}

type CostCategoryKey = keyof CostBreakdown
type ApplyCost = (month: number, category: CostCategoryKey, amount: number) => void

function emptyBreakdown(): CostBreakdown {
  return { financement: 0, energie: 0, entretien: 0, pneus: 0, assurance: 0, fiscalite: 0 }
}

function sumBreakdown(b: CostBreakdown): number {
  return b.financement + b.energie + b.entretien + b.pneus + b.assurance + b.fiscalite
}

function addBreakdowns(a: CostBreakdown, b: CostBreakdown): CostBreakdown {
  return {
    financement: a.financement + b.financement,
    energie: a.energie + b.energie,
    entretien: a.entretien + b.entretien,
    pneus: a.pneus + b.pneus,
    assurance: a.assurance + b.assurance,
    fiscalite: a.fiscalite + b.fiscalite,
  }
}

interface FinancingScheduleResult {
  maintenanceIncluded: boolean
  insuranceIncluded: boolean
}

/**
 * Places every financing-related cash flow (down payment, monthly payments, one-time fees,
 * resale credit...) on the month it actually happens, mirroring computeFinancing() in
 * calculations.ts month-by-month instead of as a single total. Summed over the whole
 * holding period this reproduces the exact same financement/fiscalite totals.
 */
function applyFinancingSchedule(
  vehicle: VehicleConfig,
  holdingYears: number,
  annualMileageKm: number,
  at: ApplyCost,
): FinancingScheduleResult {
  const totalMonths = holdingYears * 12
  const f = vehicle.financing

  if (f.mode === 'cash') {
    at(1, 'financement', vehicle.purchasePrice)
    at(totalMonths, 'financement', -f.resaleValueAtEnd)
    at(1, 'fiscalite', f.carteGriseCost + vehicle.fiscal.malus - vehicle.fiscal.bonus)
    return { maintenanceIncluded: false, insuranceIncluded: false }
  }

  if (f.mode === 'credit') {
    const principal = vehicle.purchasePrice - f.downPayment
    const M = loanMonthlyPayment(principal, f.annualInterestRatePct, f.loanDurationMonths)
    const monthsPaid = Math.min(f.loanDurationMonths, totalMonths)
    at(1, 'financement', f.downPayment)
    for (let m = 1; m <= monthsPaid; m++) {
      at(m, 'financement', M)
    }
    if (f.loanDurationMonths > totalMonths) {
      const remaining = loanRemainingBalance(principal, f.annualInterestRatePct, f.loanDurationMonths, totalMonths)
      at(totalMonths, 'financement', remaining)
    }
    at(totalMonths, 'financement', -f.resaleValueAtEnd)
    at(1, 'fiscalite', f.carteGriseCost + vehicle.fiscal.malus - vehicle.fiscal.bonus)
    return { maintenanceIncluded: false, insuranceIncluded: false }
  }

  // LOA / LDD (lease-style financing) — same branching as computeFinancing() in calculations.ts.
  const contractDurationMonths = Math.max(1, f.contractDurationMonths)
  const numContracts = Math.max(1, Math.ceil(totalMonths / contractDurationMonths))
  const remainderMonths = totalMonths % contractDurationMonths
  const endsOnBoundary = remainderMonths === 0

  const effectiveMonthlyPayment =
    f.mode === 'loa' && f.autoCalculate
      ? estimateLoaMonthlyPayment({
          purchasePrice: vehicle.purchasePrice,
          firstPayment: f.firstPayment,
          buybackValue: f.buybackValue,
          annualInterestRatePct: f.annualInterestRatePct,
          contractDurationMonths,
        })
      : f.monthlyPayment

  for (let m = 1; m <= totalMonths; m++) {
    at(m, 'financement', effectiveMonthlyPayment)
  }
  for (let k = 0; k < numContracts; k++) {
    at(1 + k * contractDurationMonths, 'financement', f.firstPayment)
  }

  // Buying out at the end of the contract means no restitution, hence no mileage check-out.
  let mileagePenaltyApplies = true

  if (f.mode === 'loa' && f.endOfContractAction === 'buyout') {
    if (endsOnBoundary) {
      at(totalMonths, 'financement', f.buybackValue - f.estimatedResaleValueAfterBuyout)
      mileagePenaltyApplies = false
    } else {
      at(totalMonths, 'financement', f.restitutionFees)
    }
  } else if (f.endOfContractAction === 'return') {
    at(totalMonths, 'financement', f.restitutionFees)
  }

  if (mileagePenaltyApplies) {
    // Simplified like the aggregate calculation: the whole-period excess/under-mileage
    // adjustment is booked as a single check-out cost at the end of the holding period,
    // rather than split contract by contract.
    const mileageCost = computeLeaseMileageCost(vehicle, holdingYears, annualMileageKm)
    at(totalMonths, 'financement', mileageCost)
  }

  // Carte grise assumed included in the lease; malus/bonus counted separately, on the first payment.
  at(1, 'fiscalite', vehicle.fiscal.malus - vehicle.fiscal.bonus)

  return { maintenanceIncluded: f.maintenanceIncluded, insuranceIncluded: f.insuranceIncluded }
}

/** Energy is smoothed evenly across each year's 12 months — the model only knows an annual average. */
function applyEnergySchedule(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number, at: ApplyCost): void {
  for (let year = 0; year < holdingYears; year++) {
    const inflationFactor = Math.pow(1 + vehicle.energy.annualPriceInflationPct / 100, year)
    let yearTotal: number
    if (isElectricEnergy(vehicle.energyType, vehicle.energy)) {
      const e = vehicle.energy
      const totalKwh = (annualMileageKm / 100) * e.consumptionKwh100km
      const homeKwh = totalKwh * (e.homeChargeSharePct / 100)
      const publicKwh = totalKwh - homeKwh
      yearTotal = (homeKwh * e.homePricePerKwh + publicKwh * e.publicPricePerKwh) * inflationFactor
    } else {
      const e = vehicle.energy as ThermalEnergyConfig
      const liters = (annualMileageKm / 100) * e.consumptionL100km
      yearTotal = liters * e.fuelPricePerLiter * inflationFactor
    }
    const monthly = yearTotal / 12
    for (let monthInYear = 1; monthInYear <= 12; monthInYear++) {
      at(year * 12 + monthInYear, 'energie', monthly)
    }
  }
}

/** Annual averages (maintenance, insurance) are smoothed monthly rather than spiked on one month. */
function applyRecurringAnnualCost(totalMonths: number, annualAmount: number, category: CostCategoryKey, at: ApplyCost): void {
  const monthly = annualAmount / 12
  for (let m = 1; m <= totalMonths; m++) {
    at(m, category, monthly)
  }
}

/** Tire replacements are placed on the month cumulative mileage first crosses each lifespan threshold. */
function applyTiresSchedule(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number, at: ApplyCost): void {
  if (vehicle.tireLifespanKm <= 0 || annualMileageKm <= 0) return
  const totalMonths = holdingYears * 12
  const totalKm = holdingYears * annualMileageKm
  const replacements = Math.floor(totalKm / vehicle.tireLifespanKm)
  const kmPerMonth = annualMileageKm / 12
  for (let k = 1; k <= replacements; k++) {
    const monthIndex = Math.min(totalMonths, Math.ceil((k * vehicle.tireLifespanKm) / kmPerMonth))
    at(monthIndex, 'pneus', vehicle.tireSetPrice)
  }
}

/**
 * Breaks a vehicle's total cost of ownership down into a real cash-flow timeline: one-time
 * events (purchase, first payment, tire changes, resale...) land on the month they actually
 * happen, while costs the model only defines as an annual average (energy, maintenance,
 * insurance) are smoothed across the year. Grouped by year for a collapsible year-by-year view.
 *
 * Invariant: summing every category across the whole schedule reproduces the exact same
 * totals as computeVehicleResult() — see monthlySchedule.test.ts.
 */
export function computeMonthlySchedule(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number): YearlyCostEntry[] {
  const totalMonths = holdingYears * 12
  const monthlyBreakdowns: CostBreakdown[] = Array.from({ length: totalMonths }, emptyBreakdown)

  const at: ApplyCost = (month, category, amount) => {
    if (amount === 0 || month < 1 || month > totalMonths) return
    monthlyBreakdowns[month - 1][category] += amount
  }

  const { maintenanceIncluded, insuranceIncluded } = applyFinancingSchedule(vehicle, holdingYears, annualMileageKm, at)
  applyEnergySchedule(vehicle, holdingYears, annualMileageKm, at)
  if (!maintenanceIncluded) applyRecurringAnnualCost(totalMonths, vehicle.maintenanceAnnualCost, 'entretien', at)
  if (!insuranceIncluded) applyRecurringAnnualCost(totalMonths, vehicle.insuranceAnnualPremium, 'assurance', at)
  applyTiresSchedule(vehicle, holdingYears, annualMileageKm, at)

  const months: MonthlyCostEntry[] = monthlyBreakdowns.map((breakdown, i) => {
    const month = i + 1
    return {
      month,
      year: Math.ceil(month / 12),
      monthInYear: ((month - 1) % 12) + 1,
      breakdown,
      totalCost: sumBreakdown(breakdown),
    }
  })

  const years: YearlyCostEntry[] = []
  let cumulativeTotalCost = 0
  for (let year = 1; year <= holdingYears; year++) {
    const yearMonths = months.slice((year - 1) * 12, year * 12)
    const breakdown = yearMonths.reduce((acc, m) => addBreakdowns(acc, m.breakdown), emptyBreakdown())
    const totalCost = sumBreakdown(breakdown)
    cumulativeTotalCost += totalCost
    years.push({ year, months: yearMonths, breakdown, totalCost, cumulativeTotalCost })
  }
  return years
}
