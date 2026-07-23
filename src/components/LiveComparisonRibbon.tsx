import type { VehicleConfig, VehicleResult } from '../types/scenario'
import { getVehicleColor } from '../lib/chartColors'
import { formatEuro } from '../lib/format'

interface Props {
  vehicles: VehicleConfig[]
  results: VehicleResult[]
}

export function LiveComparisonRibbon({ vehicles, results }: Props) {
  const sorted = [...results].sort((a, b) => a.totalCost - b.totalCost)
  const gap = sorted.length > 1 ? sorted[1].totalCost - sorted[0].totalCost : null

  return (
    <div className="border-b border-[#D3E5DE] bg-[#E4F0EC] print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-1.5 px-4 py-2.5 text-[13.5px]">
        <span className="font-semibold text-[#3E6B60]">Comparaison en direct —</span>
        {vehicles.map((vehicle, i) => {
          const result = results[i]
          return (
            <span key={vehicle.id} className="flex items-center gap-1.5 text-ink">
              <span
                className="inline-block h-[9px] w-[9px] rounded-full"
                style={{ background: getVehicleColor(vehicle, vehicles) }}
              />
              <b className="font-bold">{vehicle.label}</b>
              <span>· {formatEuro(result.totalCost)}</span>
            </span>
          )
        })}
        {gap !== null && gap > 0 && (
          <span className="rounded-full bg-teal px-2.5 py-0.5 font-bold text-white">Écart {formatEuro(gap)}</span>
        )}
      </div>
    </div>
  )
}
