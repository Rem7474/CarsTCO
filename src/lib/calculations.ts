import type {
  CostBreakdown,
  ElectricEnergyConfig,
  ThermalEnergyConfig,
  VehicleConfig,
  VehicleResult,
} from '../types/scenario'
import { estimateLoaMonthlyPayment } from './loaEstimate'
import { formatEuro } from './format'

/** Standard amortizing loan monthly payment. */
export function loanMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

/** Remaining principal balance after `monthsElapsed` payments on an amortizing loan. */
export function loanRemainingBalance(
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
  /** False when the vehicle is bought out at the end of its LOA (no restitution, so no mileage check-out). */
  mileagePenaltyApplies: boolean
  /**
   * Months, at the tail end of the holding period, during which the lessee owns the
   * vehicle outright after exercising a LOA buyout mid-holding. For these months,
   * `maintenanceIncluded`/`insuranceIncluded` no longer apply even if true, since
   * there's no more lease covering them. Zero outside of that scenario.
   */
  ownerPaidMonths: number
  notes: string[]
}

function computeFinancing(vehicle: VehicleConfig, holdingYears: number): FinancingResult {
  const totalMonths = holdingYears * 12
  const notes: string[] = []
  const f = vehicle.financing

  if (f.mode === 'cash') {
    const financementCost = vehicle.purchasePrice - f.resaleValueAtEnd
    const fiscaliteCost = f.carteGriseCost + vehicle.fiscal.malus - vehicle.fiscal.bonus
    return {
      financementCost,
      fiscaliteCost,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      mileagePenaltyApplies: false,
      ownerPaidMonths: 0,
      notes,
    }
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
    return {
      financementCost,
      fiscaliteCost,
      maintenanceIncluded: false,
      insuranceIncluded: false,
      mileagePenaltyApplies: false,
      ownerPaidMonths: 0,
      notes,
    }
  }

  // LOA / LDD (lease-style financing)
  const contractDurationMonths = Math.max(1, f.contractDurationMonths)

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

  // Carte grise is assumed already embedded in the lease payment (registered to the
  // lessor), but malus/bonus écologique are real cash flows for the lessee — in
  // practice they're usually netted against the first payment/apport by the dealer.
  const fiscaliteCost = vehicle.fiscal.malus - vehicle.fiscal.bonus
  notes.push(
    'LOA/LDD : la carte grise est supposée déjà incluse dans le loyer ; le bonus/malus écologique est compté ' +
      'séparément (en pratique souvent déduit/ajouté directement sur le premier loyer par le concessionnaire).',
  )

  // A buyout ends the lease relationship for good: the lessee purchases the vehicle at
  // the end of a single contract term and owns it outright afterward — it never renews
  // into a second lease. Modeled independently of the renewal path below whenever the
  // holding period actually reaches a full contract term.
  if (f.mode === 'loa' && f.endOfContractAction === 'buyout' && totalMonths > contractDurationMonths) {
    const ownerPaidMonths = totalMonths - contractDurationMonths
    // The first payment (apport/premier loyer majoré) stands in for month 1's rent — it's
    // not paid on top of it — so only contractDurationMonths - 1 regular payments follow.
    const financementCost =
      f.firstPayment +
      effectiveMonthlyPayment * (contractDurationMonths - 1) +
      f.buybackValue -
      f.estimatedResaleValueAfterBuyout
    notes.push(
      `LOA : option d'achat levée à la fin du contrat de ${contractDurationMonths} mois (${formatEuro(f.buybackValue)}) ; ` +
        `véhicule conservé en pleine propriété pour les ${ownerPaidMonths} mois restants de la détention (entretien/assurance ` +
        `à charge du propriétaire sur cette période), revente estimée de ${formatEuro(f.estimatedResaleValueAfterBuyout)} ` +
        'appliquée en fin de détention. Aucun frais de dépassement kilométrique (pas de restitution).',
    )
    return {
      financementCost,
      fiscaliteCost,
      maintenanceIncluded: f.maintenanceIncluded,
      insuranceIncluded: f.insuranceIncluded,
      mileagePenaltyApplies: false,
      ownerPaidMonths,
      notes,
    }
  }

  // Renewal path: the lessee keeps re-leasing (at the same simulated terms) through the
  // whole holding period — applies to 'renew', 'return', LDD (no buyout option), and a
  // buyout requested before the first contract term even completes (nothing to buy yet).
  const numContracts = Math.max(1, Math.ceil(totalMonths / contractDurationMonths))
  const remainderMonths = totalMonths % contractDurationMonths
  const endsOnBoundary = remainderMonths === 0

  // Each contract's first payment stands in for that contract's month-1 rent, not an
  // additional payment on top of it — so totalMonths includes numContracts "replaced" months.
  let financementCost = f.firstPayment * numContracts + effectiveMonthlyPayment * (totalMonths - numContracts)

  // Mileage cost is computed separately by computeLeaseMileageCost() since it
  // needs annualMileageKm, which is not part of the vehicle/financing config.
  notes.push(
    f.mode === 'loa'
      ? `LOA : ${numContracts} contrat(s) de ${f.contractDurationMonths} mois simulé(s) sur la durée de détention.`
      : `LDD : ${numContracts} contrat(s) de ${f.contractDurationMonths} mois simulé(s) sur la durée de détention.`,
  )

  // Buying out at the end of the contract means the vehicle is never handed back to the
  // lessor, so there's no mileage check-out and no excess-mileage fee to pay.
  let mileagePenaltyApplies = true

  if (f.mode === 'loa' && f.endOfContractAction === 'buyout') {
    if (endsOnBoundary) {
      financementCost += f.buybackValue
      financementCost -= f.estimatedResaleValueAfterBuyout
      mileagePenaltyApplies = false
      notes.push(
        `Option d'achat levée en fin de contrat (${formatEuro(f.buybackValue)}), puis revente estimée de ` +
          `${formatEuro(f.estimatedResaleValueAfterBuyout)} immédiatement prise en compte. Pas de restitution : ` +
          'aucun frais de dépassement kilométrique.',
      )
    } else {
      financementCost += f.restitutionFees
      notes.push(
        "Le contrat n'est pas terminé à la fin de la période de détention : rachat impossible, restitution simulée à la place.",
      )
    }
  } else if (f.endOfContractAction === 'return') {
    financementCost += f.restitutionFees
  }

  return {
    financementCost,
    fiscaliteCost,
    maintenanceIncluded: f.maintenanceIncluded,
    insuranceIncluded: f.insuranceIncluded,
    mileagePenaltyApplies,
    ownerPaidMonths: 0,
    notes,
  }
}

export function computeLeaseMileageCost(vehicle: VehicleConfig, holdingYears: number, annualMileageKm: number): number {
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

export function isElectricEnergy(
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
  const mileageCost = financing.mileagePenaltyApplies
    ? computeLeaseMileageCost(vehicle, holdingYears, annualMileageKm)
    : 0
  const financementCost = financing.financementCost + mileageCost
  notes.push(...financing.notes)

  const energieCost = computeEnergyCost(vehicle, holdingYears, annualMileageKm)

  const entretienCost = financing.maintenanceIncluded
    ? vehicle.maintenanceAnnualCost * (financing.ownerPaidMonths / 12)
    : vehicle.maintenanceAnnualCost * holdingYears
  if (financing.maintenanceIncluded) {
    notes.push(
      financing.ownerPaidMonths > 0
        ? `Entretien inclus dans le loyer pendant le contrat ; recompté pour les ${financing.ownerPaidMonths} mois de pleine propriété après le rachat.`
        : "Entretien inclus dans le loyer (non recompté).",
    )
  }

  const pneusCost = computeTiresCost(vehicle, totalKm)

  const assuranceCost = financing.insuranceIncluded
    ? vehicle.insuranceAnnualPremium * (financing.ownerPaidMonths / 12)
    : vehicle.insuranceAnnualPremium * holdingYears
  if (financing.insuranceIncluded) {
    notes.push(
      financing.ownerPaidMonths > 0
        ? `Assurance incluse dans le loyer pendant le contrat ; recomptée pour les ${financing.ownerPaidMonths} mois de pleine propriété après le rachat.`
        : "Assurance incluse dans le loyer (non recomptée).",
    )
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
