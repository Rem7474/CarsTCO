import type { ElectricEnergyConfig, EnergyType, FinancingMode, ThermalEnergyConfig, VehicleConfig } from '../types/scenario'
import { createEnergyDefaults, createFinancingDefaults } from './defaults'

interface VehicleTemplateDef {
  label: string
  energyType: EnergyType
  purchasePrice: number
  financingMode: FinancingMode
  /** L/100km for thermal, kWh/100km for electric. */
  consumption: number
  maintenanceAnnualCost: number
  tireSetPrice: number
  tireLifespanKm: number
  insuranceAnnualPremium: number
  malus?: number
  bonus?: number
}

const TEMPLATE_DEFS: VehicleTemplateDef[] = [
  {
    label: 'Citadine essence',
    energyType: 'thermal',
    purchasePrice: 21000,
    financingMode: 'credit',
    consumption: 5.5,
    maintenanceAnnualCost: 500,
    tireSetPrice: 400,
    tireLifespanKm: 35000,
    insuranceAnnualPremium: 600,
  },
  {
    label: 'Citadine électrique',
    energyType: 'electric',
    purchasePrice: 32000,
    financingMode: 'loa',
    consumption: 15,
    maintenanceAnnualCost: 280,
    tireSetPrice: 480,
    tireLifespanKm: 40000,
    insuranceAnnualPremium: 700,
  },
  {
    label: 'Berline diesel',
    energyType: 'thermal',
    purchasePrice: 34000,
    financingMode: 'credit',
    consumption: 5.0,
    maintenanceAnnualCost: 650,
    tireSetPrice: 560,
    tireLifespanKm: 45000,
    insuranceAnnualPremium: 750,
    malus: 100,
  },
  {
    label: 'Berline hybride',
    energyType: 'thermal',
    purchasePrice: 36000,
    financingMode: 'cash',
    consumption: 4.5,
    maintenanceAnnualCost: 550,
    tireSetPrice: 560,
    tireLifespanKm: 45000,
    insuranceAnnualPremium: 780,
  },
  {
    label: 'SUV électrique',
    energyType: 'electric',
    purchasePrice: 48000,
    financingMode: 'loa',
    consumption: 19,
    maintenanceAnnualCost: 350,
    tireSetPrice: 650,
    tireLifespanKm: 40000,
    insuranceAnnualPremium: 900,
  },
  {
    label: 'SUV diesel',
    energyType: 'thermal',
    purchasePrice: 42000,
    financingMode: 'credit',
    consumption: 6.5,
    maintenanceAnnualCost: 750,
    tireSetPrice: 650,
    tireLifespanKm: 45000,
    insuranceAnnualPremium: 850,
    malus: 300,
  },
]

export interface VehicleTemplate {
  id: string
  label: string
  /** Builds a full vehicle config from this template, keeping the given id. */
  apply: (id: string) => VehicleConfig
}

export const VEHICLE_TEMPLATES: VehicleTemplate[] = TEMPLATE_DEFS.map((def, i) => ({
  id: `template-${i}`,
  label: def.label,
  apply: (id: string): VehicleConfig => {
    const energy = createEnergyDefaults(def.energyType)
    if (def.energyType === 'thermal') {
      ;(energy as ThermalEnergyConfig).consumptionL100km = def.consumption
    } else {
      ;(energy as ElectricEnergyConfig).consumptionKwh100km = def.consumption
    }
    return {
      id,
      label: def.label,
      energyType: def.energyType,
      purchasePrice: def.purchasePrice,
      financing: createFinancingDefaults(def.financingMode, def.purchasePrice),
      energy,
      maintenanceAnnualCost: def.maintenanceAnnualCost,
      tireSetPrice: def.tireSetPrice,
      tireLifespanKm: def.tireLifespanKm,
      insuranceAnnualPremium: def.insuranceAnnualPremium,
      fiscal: { malus: def.malus ?? 0, bonus: def.bonus ?? 0 },
    }
  },
}))
