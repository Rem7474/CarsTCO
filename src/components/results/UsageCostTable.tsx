import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { formatEuroPrecise } from '../../lib/format'

interface Props {
  vehicles: VehicleConfig[]
  results: VehicleResult[]
  totalKm: number
}

function perHundredKm(cost: number, totalKm: number): number {
  return totalKm > 0 ? (cost / totalKm) * 100 : 0
}

export function UsageCostTable({ vehicles, results, totalKm }: Props) {
  const totals = results.map((r) => perHundredKm(r.breakdown.energie + r.breakdown.pneus, totalKm))
  const minTotal = Math.min(...totals)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Coût d'usage pur (aux 100 km)</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Énergie + pneus uniquement, indépendamment du mode de financement — pour comparer le coût de roulage pur.
        </p>
      </div>
      <table aria-label="Coût d'usage aux 100 km" className="w-full min-w-[420px] border-collapse text-sm">
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
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">Énergie /100 km</td>
            {results.map((result) => (
              <td key={result.vehicleId} className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {formatEuroPrecise(perHundredKm(result.breakdown.energie, totalKm))}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">Pneus /100 km</td>
            {results.map((result) => (
              <td key={result.vehicleId} className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {formatEuroPrecise(perHundredKm(result.breakdown.pneus, totalKm))}
              </td>
            ))}
          </tr>
          <tr className="bg-slate-50 dark:bg-slate-800/60">
            <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">Total usage /100 km</td>
            {results.map((result, i) => (
              <td
                key={result.vehicleId}
                className={`px-3 py-2.5 text-right tabular-nums ${
                  totals[i] === minTotal && totals.filter((t) => t === minTotal).length < totals.length
                    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {formatEuroPrecise(totals[i])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
