import { Fragment, useMemo, useState } from 'react'
import type { CostBreakdown, CostCategory, ScenarioConfig } from '../../types/scenario'
import { computeMonthlySchedule } from '../../lib/monthlySchedule'
import { CATEGORY_LABELS, CATEGORY_ORDER, getVehicleColor } from '../../lib/chartColors'
import { formatEuro } from '../../lib/format'

interface Props {
  scenario: ScenarioConfig
}

type ViewMode = 'compact' | 'detailed'

/** Smoothed annual averages — accrue steadily rather than landing on a single month. */
const RECURRING_CATEGORIES: CostCategory[] = ['energie', 'entretien', 'assurance']
/** Lumpy, non-recurring events — tire changes, malus/bonus/carte grise. */
const ONE_SHOT_CATEGORIES: CostCategory[] = ['pneus', 'fiscalite']

function sumCategories(breakdown: CostBreakdown, categories: CostCategory[]): number {
  return categories.reduce((sum, cat) => sum + breakdown[cat], 0)
}

function cell(value: number): string {
  return value === 0 ? '—' : formatEuro(value)
}

export function MonthlyScheduleTable({ scenario }: Props) {
  const { vehicles, holdingYears, annualMileageKm } = scenario
  const [viewMode, setViewMode] = useState<ViewMode>('compact')
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[15.5px] font-bold text-ink">Dépenses détaillées par année</h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Cliquez sur une année pour dérouler le détail mois par mois — le dépliage est synchronisé entre véhicules
            pour faciliter la comparaison.{' '}
            {viewMode === 'compact'
              ? 'Vue compacte : Récurrent regroupe énergie/entretien/assurance, Ponctuel regroupe pneus et fiscalité.'
              : "Énergie, entretien et assurance sont lissés sur l'année ; financement, pneus et fiscalité peuvent " +
                'inclure des paiements ponctuels (apport, remplacement de pneus, revente...).'}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-[10px] bg-panel p-1 text-[12.5px]">
          <button
            type="button"
            className={`rounded-[7px] px-3.5 py-1.5 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
              viewMode === 'compact' ? 'bg-teal font-bold text-white' : 'text-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('compact')}
          >
            Vue compacte
          </button>
          <button
            type="button"
            className={`rounded-[7px] px-3.5 py-1.5 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
              viewMode === 'detailed' ? 'bg-teal font-bold text-white' : 'text-muted hover:text-ink'
            }`}
            onClick={() => setViewMode('detailed')}
          >
            Vue détaillée
          </button>
        </div>
      </div>

      {viewMode === 'compact' ? (
        <div className="overflow-x-auto rounded-[20px] border border-border bg-white px-[22px] py-5">
          <table
            aria-label="Dépenses détaillées — vue compacte, tous véhicules"
            className="w-full min-w-[520px] border-collapse text-[13px]"
          >
            <thead>
              <tr>
                <th rowSpan={2} className="px-0 py-2 text-left align-bottom font-semibold text-muted">
                  Période
                </th>
                {schedules.map(({ vehicle }) => {
                  const color = getVehicleColor(vehicle, vehicles)
                  return (
                    <th
                      key={vehicle.id}
                      colSpan={4}
                      className="border-b border-border-soft border-l border-border-soft px-2.5 py-1.5 text-center font-bold text-ink"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                        {vehicle.label}
                      </span>
                    </th>
                  )
                })}
              </tr>
              <tr className="border-b border-border">
                {schedules.map(({ vehicle }) => (
                  <Fragment key={vehicle.id}>
                    <th className="border-l border-border-soft px-2.5 py-2 text-right font-semibold text-muted">
                      Financement
                    </th>
                    <th className="px-2.5 py-2 text-right font-semibold text-muted">Récurrent</th>
                    <th className="px-2.5 py-2 text-right font-semibold text-muted">Ponctuel</th>
                    <th className="px-2.5 py-2 text-right font-bold text-ink">Total</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules[0].schedule.map((_, yearIdx) => {
                const year = schedules[0].schedule[yearIdx].year
                const isExpanded = expandedYears.has(year)
                return (
                  <Fragment key={year}>
                    <tr className="border-b border-border-soft bg-chip">
                      <td className="px-0 py-2">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                          onClick={() => toggleYear(year)}
                          aria-expanded={isExpanded}
                        >
                          <span
                            className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            aria-hidden="true"
                          >
                            ›
                          </span>
                          Année {year}
                        </button>
                      </td>
                      {schedules.map(({ vehicle, schedule }) => {
                        const yearEntry = schedule[yearIdx]
                        return (
                          <Fragment key={vehicle.id}>
                            <td className="border-l border-border-soft px-2.5 py-2 text-right tabular-nums text-ink-soft">
                              {cell(yearEntry.breakdown.financement)}
                            </td>
                            <td className="px-2.5 py-2 text-right tabular-nums text-ink-soft">
                              {cell(sumCategories(yearEntry.breakdown, RECURRING_CATEGORIES))}
                            </td>
                            <td className="px-2.5 py-2 text-right tabular-nums text-ink-soft">
                              {cell(sumCategories(yearEntry.breakdown, ONE_SHOT_CATEGORIES))}
                            </td>
                            <td className="px-2.5 py-2 text-right font-bold tabular-nums text-ink">
                              {formatEuro(yearEntry.totalCost)}
                            </td>
                          </Fragment>
                        )
                      })}
                    </tr>
                    {isExpanded &&
                      schedules[0].schedule[yearIdx].months.map((_, monthIdx) => {
                        const monthInYear = schedules[0].schedule[yearIdx].months[monthIdx].monthInYear
                        return (
                          <tr key={monthInYear} className="border-b border-border-soft">
                            <td className="py-1.5 pl-6 text-muted-2">Mois {monthInYear}</td>
                            {schedules.map(({ vehicle, schedule }) => {
                              const monthEntry = schedule[yearIdx].months[monthIdx]
                              return (
                                <Fragment key={vehicle.id}>
                                  <td className="border-l border-border-soft px-2.5 py-1.5 text-right tabular-nums text-muted-2">
                                    {cell(monthEntry.breakdown.financement)}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-2">
                                    {cell(sumCategories(monthEntry.breakdown, RECURRING_CATEGORIES))}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right tabular-nums text-muted-2">
                                    {cell(sumCategories(monthEntry.breakdown, ONE_SHOT_CATEGORIES))}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right tabular-nums text-ink-soft">
                                    {formatEuro(monthEntry.totalCost)}
                                  </td>
                                </Fragment>
                              )
                            })}
                          </tr>
                        )
                      })}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
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
      )}
    </div>
  )
}
