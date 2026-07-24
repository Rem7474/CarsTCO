import { Fragment, useMemo, useState } from 'react'
import type { ScenarioConfig } from '../../types/scenario'
import { computeMonthlySchedule } from '../../lib/monthlySchedule'
import { CATEGORY_LABELS, CATEGORY_ORDER, getVehicleColor } from '../../lib/chartColors'
import { formatEuro } from '../../lib/format'

interface Props {
  scenario: ScenarioConfig
}

function cell(value: number): string {
  return value === 0 ? '—' : formatEuro(value)
}

export function MonthlyScheduleTable({ scenario }: Props) {
  const { vehicles, holdingYears, annualMileageKm } = scenario
  const [selectedId, setSelectedId] = useState(vehicles[0].id)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0]
  const schedule = useMemo(
    () => computeMonthlySchedule(selected, holdingYears, annualMileageKm),
    [selected, holdingYears, annualMileageKm],
  )

  const toggleYear = (year: number) =>
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })

  return (
    <div className="overflow-x-auto rounded-[20px] border border-border bg-white px-[26px] py-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-[15.5px] font-bold text-ink">Dépenses détaillées par année</h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choisir le véhicule à détailler">
          {vehicles.map((vehicle) => {
            const color = getVehicleColor(vehicle, vehicles)
            const isSelected = vehicle.id === selected.id
            return (
              <button
                key={vehicle.id}
                type="button"
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? 'rounded-full border px-3 py-1 text-[12.5px] font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal'
                    : 'rounded-full border border-input-border bg-white px-3 py-1 text-[12.5px] font-semibold text-ink-soft hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-teal'
                }
                style={isSelected ? { background: color, borderColor: color } : undefined}
                onClick={() => setSelectedId(vehicle.id)}
              >
                {vehicle.label}
              </button>
            )
          })}
        </div>
      </div>
      <p className="mb-4 text-[12.5px] text-muted">
        Cliquez sur une année pour dérouler le détail mois par mois. Énergie, entretien et assurance sont lissés sur
        l'année ; financement, pneus et fiscalité peuvent inclure des paiements ponctuels (apport, remplacement de
        pneus, revente...).
      </p>
      <table
        aria-label={`Dépenses détaillées — ${selected.label}`}
        className="w-full min-w-[760px] border-collapse text-[13px]"
      >
        <thead>
          <tr className="border-b border-border">
            <th className="px-0 py-2 text-left font-semibold text-muted">Période</th>
            {CATEGORY_ORDER.map((cat) => (
              <th key={cat} className="px-2.5 py-2 text-right font-semibold text-muted">
                {CATEGORY_LABELS[cat]}
              </th>
            ))}
            <th className="px-2.5 py-2 text-right font-bold text-ink">Total</th>
            <th className="px-2.5 py-2 text-right font-semibold text-muted">Cumulé</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((yearEntry) => {
            const isExpanded = expandedYears.has(yearEntry.year)
            return (
              <Fragment key={yearEntry.year}>
                <tr className="border-b border-border-soft bg-chip">
                  <td className="px-0 py-2">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                      onClick={() => toggleYear(yearEntry.year)}
                      aria-expanded={isExpanded}
                    >
                      <span
                        className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        aria-hidden="true"
                      >
                        ›
                      </span>
                      Année {yearEntry.year}
                    </button>
                  </td>
                  {CATEGORY_ORDER.map((cat) => (
                    <td key={cat} className="px-2.5 py-2 text-right tabular-nums text-ink-soft">
                      {cell(yearEntry.breakdown[cat])}
                    </td>
                  ))}
                  <td className="px-2.5 py-2 text-right font-bold tabular-nums text-ink">
                    {formatEuro(yearEntry.totalCost)}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-muted-2">
                    {formatEuro(yearEntry.cumulativeTotalCost)}
                  </td>
                </tr>
                {isExpanded &&
                  yearEntry.months.map((monthEntry) => (
                    <tr key={monthEntry.month} className="border-b border-border-soft">
                      <td className="py-1.5 pl-6 text-muted-2">Mois {monthEntry.monthInYear}</td>
                      {CATEGORY_ORDER.map((cat) => (
                        <td key={cat} className="px-2.5 py-1.5 text-right tabular-nums text-muted-2">
                          {cell(monthEntry.breakdown[cat])}
                        </td>
                      ))}
                      <td className="px-2.5 py-1.5 text-right tabular-nums text-ink-soft">
                        {formatEuro(monthEntry.totalCost)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right text-muted-2">—</td>
                    </tr>
                  ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
