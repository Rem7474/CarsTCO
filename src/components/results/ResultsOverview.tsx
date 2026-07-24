import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { getVehicleColor } from '../../lib/chartColors'
import { formatEuro, formatEuroPrecise } from '../../lib/format'

interface Props {
  vehicles: VehicleConfig[]
  results: VehicleResult[]
}

export function ResultsOverview({ vehicles, results }: Props) {
  const minCost = Math.min(...results.map((r) => r.totalCost))
  const winners = results.filter((r) => r.totalCost === minCost)
  const hasWinner = winners.length < results.length

  const sorted = [...results].sort((a, b) => a.totalCost - b.totalCost)
  const cheapest = sorted[0]
  const runnerUp = sorted[1]
  const cheapestVehicle = vehicles.find((v) => v.id === cheapest?.vehicleId)
  const runnerUpVehicle = vehicles.find((v) => v.id === runnerUp?.vehicleId)

  return (
    <div className="flex flex-col gap-5">
      {cheapestVehicle && runnerUpVehicle && cheapest.totalCost !== runnerUp.totalCost && (
        <div className="flex flex-wrap items-center gap-4 rounded-[20px] bg-teal px-[26px] py-[22px] text-white">
          <div className="font-display text-[15px] leading-relaxed">
            <b>{cheapestVehicle.label}</b> est le plus économique, avec un écart de{' '}
            <b>{formatEuro(runnerUp.totalCost - cheapest.totalCost)}</b> sur {vehicles.length > 2 ? "l'ensemble de la comparaison" : 'la durée de détention'} face à{' '}
            <b>{runnerUpVehicle.label}</b>, {vehicles.length > 2 ? 'la 2ᵉ moins chère' : 'la deuxième moins chère'}.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle, i) => {
          const result = results[i]
          const isWinner = hasWinner && result.totalCost === minCost
          const color = getVehicleColor(vehicle, vehicles)
          return (
            <div
              key={vehicle.id}
              className="relative rounded-[20px] bg-white px-6 py-[22px]"
              style={isWinner ? { border: '2px solid #0E6F5C' } : { border: '1px solid #E6DFCD' }}
            >
              {isWinner && (
                <span className="absolute -top-3 right-5 rounded-full bg-teal px-3 py-[5px] text-[11.5px] font-bold text-white">
                  Le plus économique
                </span>
              )}
              <div className="mb-2.5 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[13.5px] font-bold text-ink-soft">{vehicle.label}</span>
              </div>
              <div className="font-display text-[38px] font-extrabold text-ink">{formatEuro(result.totalCost)}</div>
              <div className="mt-3.5 flex gap-6 text-[13px] text-muted">
                <div>
                  <div className="font-bold text-ink">{formatEuro(result.costPerMonth)}</div>
                  coût mensuel moyen
                </div>
                <div>
                  <div className="font-bold text-ink">{formatEuroPrecise(result.costPerKm)}/km</div>
                  coût au kilomètre
                </div>
              </div>
              {result.notes.length > 0 && (
                <details className="mt-3.5 border-t border-border-soft pt-2.5 text-[12px] text-muted-2">
                  <summary className="cursor-pointer select-none font-semibold text-muted hover:text-ink">
                    Comment ce montant a été calculé
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {result.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
