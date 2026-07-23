interface Props {
  holdingYears: number
  annualMileageKm: number
  onHoldingYearsChange: (v: number) => void
  onAnnualMileageChange: (v: number) => void
}

interface StatTileProps {
  label: string
  /** Lowercase, distinct from `label` so it doesn't collide with getByLabelText(label) in tests. */
  adjustName: string
  value: number
  suffix: string
  step: number
  min: number
  max?: number
  onChange: (v: number) => void
}

function StatTile({ label, adjustName, value, suffix, step, min, max, onChange }: StatTileProps) {
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min, v))

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-panel px-[22px] py-[18px]">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <span className="flex items-baseline gap-2">
          <input
            type="number"
            className="w-[5.5ch] border-none bg-transparent p-0 font-display text-[34px] font-extrabold text-ink outline-none focus-visible:ring-2 focus-visible:ring-teal"
            value={Number.isNaN(value) ? '' : value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => onChange(e.target.value === '' ? 0 : clamp(parseFloat(e.target.value)))}
            onFocus={(e) => e.target.select()}
          />
          <span className="text-base font-semibold text-muted">{suffix}</span>
        </span>
      </label>
      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          className="h-9 w-9 rounded-[10px] border border-input-border bg-white text-[17px] font-bold text-ink hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          onClick={() => onChange(clamp(value + step))}
          aria-label={`Augmenter ${adjustName}`}
        >
          +
        </button>
        <button
          type="button"
          className="h-9 w-9 rounded-[10px] border border-input-border bg-white text-[17px] font-bold text-ink hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          onClick={() => onChange(clamp(value - step))}
          aria-label={`Diminuer ${adjustName}`}
        >
          –
        </button>
      </div>
    </div>
  )
}

export function ScenarioSettings({ holdingYears, annualMileageKm, onHoldingYearsChange, onAnnualMileageChange }: Props) {
  return (
    <div className="rounded-[20px] border border-border bg-white p-[26px]">
      <h2 className="mb-0.5 font-display text-[19px] font-bold text-ink">Usage commun à tous les véhicules</h2>
      <p className="mb-5 text-[13.5px] text-muted">
        Ajustez un paramètre : tous les résultats se recalculent instantanément, sans bouton « Calculer ».
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatTile
          label="Durée de détention / analyse"
          adjustName="la durée de détention"
          value={holdingYears}
          onChange={onHoldingYearsChange}
          suffix="ans"
          step={1}
          min={1}
          max={15}
        />
        <StatTile
          label="Kilométrage annuel parcouru"
          adjustName="le kilométrage annuel"
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
