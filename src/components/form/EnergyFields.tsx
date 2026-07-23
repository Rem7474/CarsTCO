import type { ElectricEnergyConfig, EnergyType, ThermalEnergyConfig } from '../../types/scenario'
import { NumberField } from './Field'

interface Props {
  energyType: EnergyType
  energy: ThermalEnergyConfig | ElectricEnergyConfig
  onChange: (energy: ThermalEnergyConfig | ElectricEnergyConfig) => void
}

export function EnergyFields({ energyType, energy, onChange }: Props) {
  if (energyType === 'thermal') {
    const e = energy as ThermalEnergyConfig
    return (
      <>
        <NumberField
          label="Consommation moyenne"
          value={e.consumptionL100km}
          onChange={(v) => onChange({ ...e, consumptionL100km: v })}
          suffix="L/100km"
          step={0.1}
        />
        <NumberField
          label="Prix du carburant"
          value={e.fuelPricePerLiter}
          onChange={(v) => onChange({ ...e, fuelPricePerLiter: v })}
          suffix="€/L"
          step={0.01}
        />
        <NumberField
          label="Inflation annuelle du prix"
          value={e.annualPriceInflationPct}
          onChange={(v) => onChange({ ...e, annualPriceInflationPct: v })}
          suffix="%/an"
          step={0.5}
          min={-15}
          help="Optionnel — laissez à 0 pour un prix constant (négatif possible si vous anticipez une baisse)."
        />
      </>
    )
  }

  const e = energy as ElectricEnergyConfig
  return (
    <>
      <NumberField
        label="Consommation moyenne"
        value={e.consumptionKwh100km}
        onChange={(v) => onChange({ ...e, consumptionKwh100km: v })}
        suffix="kWh/100km"
        step={0.5}
      />
      <NumberField
        label="Part de recharge à domicile"
        value={e.homeChargeSharePct}
        onChange={(v) => onChange({ ...e, homeChargeSharePct: Math.min(100, Math.max(0, v)) })}
        suffix="%"
        step={5}
        min={0}
        max={100}
      />
      <NumberField
        label="Prix recharge domicile"
        value={e.homePricePerKwh}
        onChange={(v) => onChange({ ...e, homePricePerKwh: v })}
        suffix="€/kWh"
        step={0.01}
      />
      <NumberField
        label="Prix recharge publique/rapide"
        value={e.publicPricePerKwh}
        onChange={(v) => onChange({ ...e, publicPricePerKwh: v })}
        suffix="€/kWh"
        step={0.01}
      />
      <NumberField
        label="Inflation annuelle du prix"
        value={e.annualPriceInflationPct}
        onChange={(v) => onChange({ ...e, annualPriceInflationPct: v })}
        suffix="%/an"
        step={0.5}
        min={-15}
        help="Optionnel — laissez à 0 pour un prix constant (négatif possible si vous anticipez une baisse)."
      />
    </>
  )
}
