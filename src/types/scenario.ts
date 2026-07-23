export type EnergyType = 'thermal' | 'electric'

export type FinancingMode = 'cash' | 'credit' | 'loa' | 'ldd'

export interface CashFinancing {
  mode: 'cash'
  carteGriseCost: number
  resaleValueAtEnd: number
}

export interface CreditFinancing {
  mode: 'credit'
  downPayment: number
  annualInterestRatePct: number
  loanDurationMonths: number
  carteGriseCost: number
  resaleValueAtEnd: number
}

/** Shared fields between LOA and LDD lease-style financing. */
export interface LeaseFinancingBase {
  firstPayment: number
  monthlyPayment: number
  contractDurationMonths: number
  contractualAnnualMileageKm: number
  excessMileageCostPerKm: number
  underMileageRefundPerKm: number
  restitutionFees: number
  maintenanceIncluded: boolean
  insuranceIncluded: boolean
}

export interface LoaFinancing extends LeaseFinancingBase {
  mode: 'loa'
  endOfContractAction: 'renew' | 'buyout' | 'return'
  buybackValue: number
  estimatedResaleValueAfterBuyout: number
}

export interface LddFinancing extends LeaseFinancingBase {
  mode: 'ldd'
  endOfContractAction: 'renew' | 'return'
}

export type Financing = CashFinancing | CreditFinancing | LoaFinancing | LddFinancing

export interface ThermalEnergyConfig {
  consumptionL100km: number
  fuelPricePerLiter: number
  annualPriceInflationPct: number
}

export interface ElectricEnergyConfig {
  consumptionKwh100km: number
  homePricePerKwh: number
  publicPricePerKwh: number
  homeChargeSharePct: number
  annualPriceInflationPct: number
}

export interface FiscalConfig {
  malus: number
  bonus: number
}

export interface VehicleConfig {
  id: string
  label: string
  energyType: EnergyType
  purchasePrice: number
  financing: Financing
  energy: ThermalEnergyConfig | ElectricEnergyConfig
  maintenanceAnnualCost: number
  tireSetPrice: number
  tireLifespanKm: number
  insuranceAnnualPremium: number
  fiscal: FiscalConfig
}

export interface ScenarioConfig {
  holdingYears: number
  annualMileageKm: number
  vehicles: VehicleConfig[]
}

export type CostCategory =
  | 'financement'
  | 'energie'
  | 'entretien'
  | 'pneus'
  | 'assurance'
  | 'fiscalite'

export interface CostBreakdown {
  financement: number
  energie: number
  entretien: number
  pneus: number
  assurance: number
  fiscalite: number
}

export interface VehicleResult {
  vehicleId: string
  breakdown: CostBreakdown
  totalCost: number
  costPerMonth: number
  costPerKm: number
  notes: string[]
}
