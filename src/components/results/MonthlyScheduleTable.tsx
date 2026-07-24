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
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  const schedules = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        vehicle,
        schedule: computeMonthlySchedule(vehicle, holdingYears, annualMileageKm),
      })),
    [vehicles, holdingYears, annualMileageKm],
  )

  const toggleYear = (year: number) =>
    setExpandedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-[15.5px] font-bold text-ink">Dépenses détaillées par année</h3>
        <p className="mt-0.5 text-[12.5px] text-muted">
          Cliquez sur une année pour dérouler le détail mois par mois — le dépliage est synchronisé entre véhicules
          pour faciliter la comparaison. Énergie, entretien et assurance sont lissés sur l'année ; financement,
          pneus et fiscalité peuvent inclure des paiements ponctuels (apport, remplacement de pneus, revente...).
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        {schedules.map(({ vehicle, schedule }) => {
          const color = getVehicleColor(vehicle, vehicles)
          return (
            <div
              key={vehicle.id}
              className="overflow-x-auto rounded-[20px] border border-border bg-white px-[22px] py-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                <h4 className="font-display text-[14px] font-bold text-ink">{vehicle.label}</h4>
              </div>
              <table
                aria-label={`Dépenses détaillées — ${vehicle.label}`}
                className="w-full min-w-[680px] border-collapse text-[13px]"
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
        })}
      </div>
    </div>
  )
}
