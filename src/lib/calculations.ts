import type {
  CostBreakdown,
  ElectricEnergyConfig,
  ThermalEnergyConfig,
  VehicleConfig,
  VehicleResult,
} from '../types/scenario'
import { estimateLoaMonthlyPayment } from './loaEstimate'

/** Standard amortizing loan monthly payment. */
function loanMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

/** Remaining principal balance after `monthsElapsed` payments on an amortizing loan. */
function loanRemainingBalance(
  principal: number,
  annualRatePct: number,
  totalMonths: number,
  monthsElapsed: number,
): number {
  if (monthsElapsed >= totalMonths) return 0
  const r = annualRatePct / 100 / 12
  const M = loanMonthlyPayment(principal, annualRatePct, totalMonths)
  if (r === 0) return principal - M * monthsElapsed
  return principal * Math.pow(1 + r, monthsElapsed) - M * ((Math.pow(1 + r, monthsElapsed) - 1) / r)
}

interface FinancingResult {
  financementCost: number
  fiscaliteCost: number
  maintenanceIncluded: boolean
  insuranceIncluded: boolean
  notes: string[]
}

function computeFinancing(vehicle: VehicleConfig, holdingYears: number): FinancingResult {
  const totalMonths = holdingYears * 12
  const notes: string[] = []
  const f = vehicle.financing

  if (f.mode === 'cash') {
    const financementCost = vehicle.purchasePrice - f.resaleValueAtEnd
    const fiscaliteCost = f.carteGriseCost + vehicle.fiscal.malus - vehicle.fiscal.bonus
    return { financementCost, fiscaliteCost, maintenanceIncluded: false, insuranceIncluded: false, notes }
  }

  if (f.mode === 'credit') {
    const principal = vehicle.purchasePrice - f.downPayment
    const M = loanMonthlyPayment(principal, f.annualInterestRatePct, f.loanDurationMonths)
    const monthsPaid = Math.min(f.loanDurationMonths, totalMonths)
    let financementCost = f.downPayment + M * monthsPaid
    if (f.loanDurationMonths > totalMonths) {
      const remaining = loanRemainingBalance(principal, f.annualInterestRatePct, f.loanDurationMonths, totalMonths)
      financementCost += remaining
      notes.push(
        `Crédit non soldé à la fin de la détention : solde restant dû (${Math.round(remaining).toLocaleString('fr-FR')} €) ajouté au coût.`,
      )
    }
    financementCost -= f.resaleValueAtEnd
    const fiscaliteCost = f.carteGriseCost + vehicle.fiscal.malus - vehicle.fiscal.bonus
    return { financementCost, fiscaliteCost, maintenanceIncluded: false, insuranceIncluded: false, notes }
  }

  // LOA / LDD (lease-style financing)
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

  let financementCost = f.firstPayment * numContracts + effectiveMonthlyPayment * totalMonths

  // Mileage cost is computed separately by computeLeaseMileageCost() since it
  // needs annualMileageKm, which is not part of the vehicle/financing config.
  notes.push(
    f.mode === 'loa'
      ? `LOA : ${numContracts} contrat(s) de ${f.contractDurationMonths} mois simulé(s) sur la durée de détention.`
      : `LDD : ${numContracts} contrat(s) de ${f.contractDurationMonths} mois simulé(s) sur la durée de détention.`,
  )

  if (f.mode === 'loa' && f.endOfContractAction === 'buyout') {
    if (endsOnBoundary) {
      financementCost += f.buybackValue
      financementCost -= f.estimatedResaleValueAfterBuyout
      notes.push('Option d\'achat levée en fin de contrat, puis revente estimée immédiate prise en compte.')
    } else {
      financementCost += f.restitutionFees
      notes.push(
        "La durée de détention ne tombe pas sur une fin de contrat : rachat non applicable, restitution simulée à la place.",
      )
    }
  } else if (f.endOfContractAction === 'return') {
    financementCost += f.restitutionFees
  }

  // Carte grise is assumed already embedded in the lease payment (registered to the
  // lessor), but malus/bonus écologique are real cash flows for the lessee — in
  // practice they're usually netted against the first payment/apport by the dealer.
  const fiscaliteCost = vehicle.fiscal.malus - vehicle.fiscal.bonus
  notes.push(
    'LOA/LDD : la carte grise est supposée déjà incluse dans le loyer ; le bonus/malus écologique est compté ' +
      'séparément (en pratique souvent déduit/ajouté directement sur le premier loyer par le concessionnaire).',
  )

  return {
    financementCost,
    fiscaliteCost,
    maintenanceIncluded: f.maintenanceIncluded,
    insuranceIncluded: f.insuranceIncluded,
    notes,
  }
}

function computeLeaseMileageCost(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number): number {
  const f = vehicle.financing
  if (f.mode !== 'loa' && f.mode !== 'ldd') return 0
  const totalMonths = holdingYears * 12
  const contractualTotalKm = (f.contractualAnnualMileageKm / 12) * totalMonths
  const actualTotalKm = annualMileageKm * holdingYears
  if (actualTotalKm > contractualTotalKm) {
    return (actualTotalKm - contractualTotalKm) * f.excessMileageCostPerKm
  }
  if (actualTotalKm < contractualTotalKm) {
    return -(contractualTotalKm - actualTotalKm) * f.underMileageRefundPerKm
  }
  return 0
}

function isElectricEnergy(
  energyType: VehicleConfig['energyType'],
  _energy: ThermalEnergyConfig | ElectricEnergyConfig,
): _energy is ElectricEnergyConfig {
  return energyType === 'electric'
}

function computeEnergyCost(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number): number {
  let total = 0
  for (let year = 0; year < holdingYears; year++) {
    const inflationFactor = Math.pow(
      1 + vehicle.energy.annualPriceInflationPct / 100,
      year,
    )
    if (isElectricEnergy(vehicle.energyType, vehicle.energy)) {
      const e = vehicle.energy
      const totalKwh = (annualMileageKm / 100) * e.consumptionKwh100km
      const homeKwh = totalKwh * (e.homeChargeSharePct / 100)
      const publicKwh = totalKwh - homeKwh
      total += (homeKwh * e.homePricePerKwh + publicKwh * e.publicPricePerKwh) * inflationFactor
    } else {
      const e = vehicle.energy as ThermalEnergyConfig
      const liters = (annualMileageKm / 100) * e.consumptionL100km
      total += liters * e.fuelPricePerLiter * inflationFactor
    }
  }
  return total
}

function computeTiresCost(vehicle: VehicleConfig, totalKm: number): number {
  if (vehicle.tireLifespanKm <= 0) return 0
  const replacements = Math.floor(totalKm / vehicle.tireLifespanKm)
  return replacements * vehicle.tireSetPrice
}

export function computeVehicleResult(
  vehicle: VehicleConfig,
  holdingYears: number,
  annualMileageKm: number,
): VehicleResult {
  const totalKm = holdingYears * annualMileageKm
  const notes: string[] = []

  const financing = computeFinancing(vehicle, holdingYears)
  const mileageCost = computeLeaseMileageCost(vehicle, holdingYears, annualMileageKm)
  const financementCost = financing.financementCost + mileageCost
  notes.push(...financing.notes)

  const energieCost = computeEnergyCost(vehicle, holdingYears, annualMileageKm)

  const entretienCost = financing.maintenanceIncluded ? 0 : vehicle.maintenanceAnnualCost * holdingYears
  if (financing.maintenanceIncluded) {
    notes.push("Entretien inclus dans le loyer (non recompté).")
  }

  const pneusCost = computeTiresCost(vehicle, totalKm)

  const assuranceCost = financing.insuranceIncluded ? 0 : vehicle.insuranceAnnualPremium * holdingYears
  if (financing.insuranceIncluded) {
    notes.push("Assurance incluse dans le loyer (non recomptée).")
  }

  const fiscaliteCost = financing.fiscaliteCost

  const breakdown: CostBreakdown = {
    financement: financementCost,
    energie: energieCost,
    entretien: entretienCost,
    pneus: pneusCost,
    assurance: assuranceCost,
    fiscalite: fiscaliteCost,
  }

  const totalCost =
    breakdown.financement +
    breakdown.energie +
    breakdown.entretien +
    breakdown.pneus +
    breakdown.assurance +
    breakdown.fiscalite

  return {
    vehicleId: vehicle.id,
    breakdown,
    totalCost,
    costPerMonth: totalCost / (holdingYears * 12),
    costPerKm: totalKm > 0 ? totalCost / totalKm : 0,
    notes,
  }
}
