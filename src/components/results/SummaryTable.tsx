import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/chartColors'
import { formatEuro, formatEuroPrecise } from '../../lib/format'

interface Props {
  vehicleA: VehicleConfig
  vehicleB: VehicleConfig
  resultA: VehicleResult
  resultB: VehicleResult
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

export function SummaryTable({ vehicleA, vehicleB, resultA, resultB }: Props) {
  const aWins = resultA.totalCost < resultB.totalCost
  const bWins = resultB.totalCost < resultA.totalCost

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="px-3 py-2.5 text-left font-semibold text-slate-800 dark:text-slate-100">Poste</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">{vehicleA.label}</th>
            <th className="px-3 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">{vehicleB.label}</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORY_ORDER.map((cat) => (
            <tr key={cat} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{CATEGORY_LABELS[cat]}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {formatEuro(resultA.breakdown[cat])}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {formatEuro(resultB.breakdown[cat])}
              </td>
            </tr>
          ))}
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
            <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">Coût total</td>
            <Cell value={formatEuro(resultA.totalCost)} isWinner={aWins} />
            <Cell value={formatEuro(resultB.totalCost)} isWinner={bWins} />
          </tr>
          <tr>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">Coût mensuel moyen</td>
            <Cell value={formatEuro(resultA.costPerMonth)} isWinner={aWins} />
            <Cell value={formatEuro(resultB.costPerMonth)} isWinner={bWins} />
          </tr>
          <tr>
            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">Coût au kilomètre</td>
            <Cell value={`${formatEuroPrecise(resultA.costPerKm)}/km`} isWinner={aWins} />
            <Cell value={`${formatEuroPrecise(resultB.costPerKm)}/km`} isWinner={bWins} />
          </tr>
        </tbody>
      </table>
      {(resultA.totalCost !== resultB.totalCost) && (
        <p className="border-t border-slate-100 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {aWins ? vehicleA.label : vehicleB.label}
          </span>{' '}
          est le plus économique, avec un écart de {formatEuro(Math.abs(resultA.totalCost - resultB.totalCost))} sur la
          durée de détention.
        </p>
      )}
    </div>
  )
}
