import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { CATEGORY_LABELS, CATEGORY_ORDER, getVehicleColor } from '../../lib/chartColors'
import { formatEuro, formatEuroPrecise } from '../../lib/format'

interface Props {
  vehicles: VehicleConfig[]
  results: VehicleResult[]
}

function Cell({ value, isWinner, roundedRight }: { value: string; isWinner: boolean; roundedRight?: boolean }) {
  return (
    <td
      className={`px-3 py-2.5 text-right tabular-nums ${isWinner ? 'font-bold text-teal' : 'text-ink-soft'} ${roundedRight ? 'rounded-r-lg' : ''}`}
    >
      {value}
    </td>
  )
}

export function SummaryTable({ vehicles, results }: Props) {
  const minCost = Math.min(...results.map((r) => r.totalCost))
  const winners = results.filter((r) => r.totalCost === minCost)
  const isWinner = (r: VehicleResult) => r.totalCost === minCost && winners.length < results.length

  return (
    <div className="overflow-x-auto rounded-[20px] border border-border bg-white px-[26px] py-6">
      <h3 className="mb-4 font-display text-[15.5px] font-bold text-ink">Tableau de synthèse détaillé</h3>
      <table aria-label="Tableau de synthèse" className="w-full min-w-[420px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-border">
            <th className="px-0 py-2 text-left font-semibold text-muted">Poste</th>
            {vehicles.map((vehicle) => (
              <th
                key={vehicle.id}
                className="px-3 py-2 text-right font-bold"
                style={{ color: getVehicleColor(vehicle, vehicles) }}
              >
                {vehicle.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORY_ORDER.map((cat) => (
            <tr key={cat} className="border-b border-border-soft">
              <td className="px-0 py-[7px] text-muted">{CATEGORY_LABELS[cat]}</td>
              {results.map((result) => (
                <td key={result.vehicleId} className="px-3 py-[7px] text-right tabular-nums text-ink-soft">
                  {formatEuro(result.breakdown[cat])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-chip">
            <td className="rounded-l-lg px-2 py-2.5 font-bold text-ink">Coût total</td>
            {results.map((result, i) => (
              <Cell
                key={result.vehicleId}
                value={formatEuro(result.totalCost)}
                isWinner={isWinner(result)}
                roundedRight={i === results.length - 1}
              />
            ))}
          </tr>
          <tr>
            <td className="px-0 py-2 text-muted">Coût mensuel moyen</td>
            {results.map((result) => (
              <Cell key={result.vehicleId} value={formatEuro(result.costPerMonth)} isWinner={isWinner(result)} />
            ))}
          </tr>
          <tr>
            <td className="px-0 py-2 text-muted">Coût au kilomètre</td>
            {results.map((result) => (
              <Cell
                key={result.vehicleId}
                value={`${formatEuroPrecise(result.costPerKm)}/km`}
                isWinner={isWinner(result)}
              />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
