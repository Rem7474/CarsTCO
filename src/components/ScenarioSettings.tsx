import { NumberField } from './form/Field'

interface Props {
  holdingYears: number
  annualMileageKm: number
  onHoldingYearsChange: (v: number) => void
  onAnnualMileageChange: (v: number) => void
}

export function ScenarioSettings({ holdingYears, annualMileageKm, onHoldingYearsChange, onAnnualMileageChange }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Usage (commun aux deux véhicules)</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="Durée de détention / analyse"
          value={holdingYears}
          onChange={onHoldingYearsChange}
          suffix="ans"
          step={1}
          min={1}
          max={15}
        />
        <NumberField
          label="Kilométrage annuel parcouru"
          value={annualMileageKm}
          onChange={onAnnualMileageChange}
          suffix="km/an"
          step={1000}
          min={0}
        />
      </div>
    </div>
  )
}
