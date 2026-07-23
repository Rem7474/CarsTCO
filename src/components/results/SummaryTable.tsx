import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/chartColors'
import { formatEuro, formatEuroPrecise } from '../../lib/format'

interface Props {
  vehicles: VehicleConfig[]
  results: VehicleResult[]
}

function Cell({ value, isWinner }: { value: string; isWinner: boolean }) {
  return (
    <td
      className={`px-3 py-2 text-right tabular-nums ${
        isWinner
          ? 'font-semibold text-emerald-700 dark:text-emerald-400'
          : 'text-slate-700 dark:text-slate-300'
      }`}
    >
      {value}
    </td>
  )
}

export function SummaryTable({ vehicles, results }: Props) {
  const minCost = Math.min(...results.map((r) => r.totalCost))
  const winners = results.filter((r) => r.totalCost === minCost)
  const isWinner = (r: VehicleResult) => r.totalCost === minCost && winners.length < results.length

  const sorted = [...results].sort((a, b) => a.totalCost - b.totalCost)
  const cheapest = sorted[0]
  const runnerUp = sorted[1]
  const cheapestVehicle = vehicles.find((v) => v.id === cheapest?.vehicleId)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-3 py-2.5 text-left font-semibold text-slate-800 dark:text-slate-100">Poste</th>
            {vehicles.map((vehicle) => (
              <th key={vehicle.id} className="px-3 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                {vehicle.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORY_ORDER.map((cat) => (
            <tr key={cat} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{CATEGORY_LABELS[cat]}</td>
              {results.map((result) => (
                <td
                  key={result.vehicleId}
                  className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300"
                >
                  {formatEuro(result.breakdown[cat])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
            <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">Coût total</td>
            {results.map((result) => (
              <Cell key={result.vehicleId} value={formatEuro(result.totalCost)} isWinner={isWinner(result)} />
            ))}
          </tr>
          <tr>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">Coût mensuel moyen</td>
            {results.map((result) => (
              <Cell key={result.vehicleId} value={formatEuro(result.costPerMonth)} isWinner={isWinner(result)} />
            ))}
          </tr>
          <tr>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">Coût au kilomètre</td>
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
      {cheapestVehicle && runnerUp && cheapest.totalCost !== runnerUp.totalCost && (
        <p className="border-t border-slate-100 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{cheapestVehicle.label}</span> est le
          plus économique, avec un écart de {formatEuro(runnerUp.totalCost - cheapest.totalCost)} sur la durée de
          détention face au deuxième moins cher.
        </p>
      )}
    </div>
  )
}
