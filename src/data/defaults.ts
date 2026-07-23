import type {
  CashFinancing,
  CreditFinancing,
  ElectricEnergyConfig,
  EnergyType,
  Financing,
  FinancingMode,
  LddFinancing,
  LoaFinancing,
  ScenarioConfig,
  ThermalEnergyConfig,
  VehicleConfig,
} from '../types/scenario'

export function createEnergyDefaults(energyType: EnergyType): ThermalEnergyConfig | ElectricEnergyConfig {
  if (energyType === 'electric') {
    const config: ElectricEnergyConfig = {
      consumptionKwh100km: 16,
      homePricePerKwh: 0.2,
      publicPricePerKwh: 0.5,
      homeChargeSharePct: 80,
      annualPriceInflationPct: 2,
    }
    return config
  }
  const config: ThermalEnergyConfig = {
    consumptionL100km: 6.0,
    fuelPricePerLiter: 1.85,
    annualPriceInflationPct: 2,
  }
  return config
}

/** Builds a sensible default financing config for a given mode, seeded from the purchase price. */
export function createFinancingDefaults(mode: FinancingMode, purchasePrice: number): Financing {
  switch (mode) {
    case 'cash': {
      const financing: CashFinancing = {
        mode: 'cash',
        carteGriseCost: 200,
        resaleValueAtEnd: Math.round(purchasePrice * 0.4),
      }
      return financing
    }
    case 'credit': {
      const financing: CreditFinancing = {
        mode: 'credit',
        downPayment: Math.round(purchasePrice * 0.15),
        annualInterestRatePct: 5.5,
        loanDurationMonths: 60,
        carteGriseCost: 200,
        resaleValueAtEnd: Math.round(purchasePrice * 0.4),
      }
      return financing
    }
    case 'loa': {
      const financing: LoaFinancing = {
        mode: 'loa',
        firstPayment: Math.round(purchasePrice * 0.1),
        monthlyPayment: Math.round(purchasePrice / 90),
        contractDurationMonths: 37,
        contractualAnnualMileageKm: 12000,
        excessMileageCostPerKm: 0.08,
        underMileageRefundPerKm: 0,
        restitutionFees: 150,
        maintenanceIncluded: false,
        insuranceIncluded: false,
        endOfContractAction: 'buyout',
        buybackValue: Math.round(purchasePrice * 0.45),
        estimatedResaleValueAfterBuyout: Math.round(purchasePrice * 0.4),
      }
      return financing
    }
    case 'ldd': {
      const financing: LddFinancing = {
        mode: 'ldd',
        firstPayment: Math.round(purchasePrice * 0.05),
        monthlyPayment: Math.round(purchasePrice / 75),
        contractDurationMonths: 36,
        contractualAnnualMileageKm: 12000,
        excessMileageCostPerKm: 0.09,
        underMileageRefundPerKm: 0,
        restitutionFees: 150,
        maintenanceIncluded: true,
        insuranceIncluded: false,
        endOfContractAction: 'renew',
      }
      return financing
    }
  }
}

export function createDefaultThermalVehicle(): VehicleConfig {
  const financing: CreditFinancing = {
    mode: 'credit',
    downPayment: 4000,
    annualInterestRatePct: 5.5,
    loanDurationMonths: 60,
    carteGriseCost: 220,
    resaleValueAtEnd: 11200,
  }
  return {
    id: 'vehicleA',
    label: 'Citadine thermique',
    energyType: 'thermal',
    purchasePrice: 28000,
    financing,
    energy: {
      consumptionL100km: 6.0,
      fuelPricePerLiter: 1.85,
      annualPriceInflationPct: 2,
    },
    maintenanceAnnualCost: 600,
    tireSetPrice: 480,
    tireLifespanKm: 40000,
    insuranceAnnualPremium: 700,
    fiscal: {
      malus: 50,
      bonus: 0,
    },
  }
}

export function createDefaultElectricVehicle(): VehicleConfig {
  const financing: LoaFinancing = {
    mode: 'loa',
    firstPayment: 3000,
    monthlyPayment: 349,
    contractDurationMonths: 37,
    contractualAnnualMileageKm: 12000,
    excessMileageCostPerKm: 0.08,
    underMileageRefundPerKm: 0,
    restitutionFees: 150,
    maintenanceIncluded: false,
    insuranceIncluded: false,
    endOfContractAction: 'buyout',
    buybackValue: 16500,
    estimatedResaleValueAfterBuyout: 15000,
  }
  return {
    id: 'vehicleB',
    label: 'Citadine électrique',
    energyType: 'electric',
    purchasePrice: 38000,
    financing,
    energy: {
      consumptionKwh100km: 16,
      homePricePerKwh: 0.2,
      publicPricePerKwh: 0.5,
      homeChargeSharePct: 80,
      annualPriceInflationPct: 2,
    },
    maintenanceAnnualCost: 300,
    tireSetPrice: 560,
    tireLifespanKm: 45000,
    insuranceAnnualPremium: 780,
    fiscal: {
      malus: 0,
      bonus: 0,
    },
  }
}

export function createDefaultScenario(): ScenarioConfig {
  return {
    holdingYears: 5,
    annualMileageKm: 12000,
    vehicleA: createDefaultThermalVehicle(),
    vehicleB: createDefaultElectricVehicle(),
  }
}
