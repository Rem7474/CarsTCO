import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ScenarioConfig } from '../../types/scenario'
import { computeCostByDuration, computeCostByMileage, findMileageCrossover } from '../../lib/breakeven'
import { VEHICLE_COLOR_A, VEHICLE_COLOR_B } from '../../lib/chartColors'
import { formatEuro, formatKm } from '../../lib/format'

interface Props {
  scenario: ScenarioConfig
}

interface TooltipPayloadItem {
  dataKey: string
  value: number
  color: string
  name: string
}

function ChartTooltip({
  active,
  payload,
  label,
  xSuffix,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  xSuffix: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-slate-200 bg-[var(--chart-surface)] px-3 py-2 text-xs shadow-lg dark:border-slate-700">
      <p className="mb-1 font-semibold text-[var(--chart-text-primary)]">
        {label}
        {xSuffix}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-[var(--chart-text-secondary)]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="tabular-nums text-[var(--chart-text-primary)]">{formatEuro(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function BreakEvenChart({ scenario }: Props) {
  const [mode, setMode] = useState<'mileage' | 'duration'>('mileage')

  const mileagePoints = useMemo(() => computeCostByMileage(scenario), [scenario])
  const durationPoints = useMemo(() => computeCostByDuration(scenario), [scenario])
  const crossover = useMemo(() => findMileageCrossover(mileagePoints), [mileagePoints])

  const data = useMemo(
    () =>
      mode === 'mileage'
        ? mileagePoints.map((p) => ({ x: p.annualMileageKm, totalCostA: p.totalCostA, totalCostB: p.totalCostB }))
        : durationPoints.map((p) => ({ x: p.years, totalCostA: p.totalCostA, totalCostB: p.totalCostB })),
    [mode, mileagePoints, durationPoints],
  )
  const xKey = 'x'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Coût cumulé — seuil de rentabilité</h3>
        <div className="flex gap-1 rounded-md border border-slate-200 p-0.5 text-xs dark:border-slate-700">
          <button
            className={`rounded px-2 py-1 ${
              mode === 'mileage'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            onClick={() => setMode('mileage')}
          >
            Vs kilométrage annuel
          </button>
          <button
            className={`rounded px-2 py-1 ${
              mode === 'duration'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            onClick={() => setMode('duration')}
          >
            Vs durée de détention
          </button>
        </div>
      </div>

      {mode === 'mileage' && crossover.crossoverMileageKm && (
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Seuil estimé autour de <span className="font-semibold text-slate-700 dark:text-slate-200">{formatKm(crossover.crossoverMileageKm)}/an</span> :
          en dessous, {crossover.cheaperBelowCrossover === 'A' ? scenario.vehicleA.label : scenario.vehicleB.label} est le
          plus économique ; au-dessus, c'est l'inverse.
        </p>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey={xKey}
            tickFormatter={(v) => (mode === 'mileage' ? `${(v / 1000).toFixed(0)}k` : `${v} ans`)}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v) => formatEuro(v)}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            width={80}
          />
          <Tooltip
            content={<ChartTooltip xSuffix={mode === 'mileage' ? ' km/an' : ' ans'} />}
            cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
          />
          <Legend
            itemSorter={null}
            formatter={(value: string) => <span className="text-xs text-[var(--chart-text-secondary)]">{value}</span>}
          />
          {mode === 'mileage' && (
            <ReferenceLine
              x={scenario.annualMileageKm}
              stroke="var(--chart-axis)"
              strokeDasharray="4 4"
              label={{ value: 'Usage actuel', position: 'top', fill: 'var(--chart-muted)', fontSize: 11 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="totalCostA"
            name={scenario.vehicleA.label}
            stroke={VEHICLE_COLOR_A}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="totalCostB"
            name={scenario.vehicleB.label}
            stroke={VEHICLE_COLOR_B}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
