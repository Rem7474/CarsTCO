import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { getVehicleColor } from '../../lib/chartColors'
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
    <div className="overflow-x-auto rounded-[20px] border border-border bg-white px-[26px] py-6">
      <h3 className="mb-0.5 font-display text-[15.5px] font-bold text-ink">Coût d'usage pur (aux 100 km)</h3>
      <p className="mb-4 text-[12.5px] text-muted">
        Énergie + pneus uniquement, indépendamment du mode de financement.
      </p>
      <table aria-label="Coût d'usage aux 100 km" className="w-full min-w-[420px] border-collapse text-[13.5px]">
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
          <tr className="border-b border-border-soft">
            <td className="px-0 py-[7px] text-muted">Énergie /100 km</td>
            {results.map((result) => (
              <td key={result.vehicleId} className="px-3 py-[7px] text-right tabular-nums text-ink-soft">
                {formatEuroPrecise(perHundredKm(result.breakdown.energie, totalKm))}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border-soft">
            <td className="px-0 py-[7px] text-muted">Pneus /100 km</td>
            {results.map((result) => (
              <td key={result.vehicleId} className="px-3 py-[7px] text-right tabular-nums text-ink-soft">
                {formatEuroPrecise(perHundredKm(result.breakdown.pneus, totalKm))}
              </td>
            ))}
          </tr>
          <tr className="bg-chip">
            <td className="rounded-l-lg px-2 py-2.5 font-bold text-ink">Total /100 km</td>
            {results.map((result, i) => (
              <td
                key={result.vehicleId}
                className={`px-3 py-2.5 text-right tabular-nums ${
                  totals[i] === minTotal && totals.filter((t) => t === minTotal).length < totals.length
                    ? 'font-bold text-teal'
                    : 'text-ink-soft'
                } ${i === results.length - 1 ? 'rounded-r-lg' : ''}`}
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
