import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { VehicleConfig, VehicleResult } from '../../types/scenario'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/chartColors'
import { formatEuro } from '../../lib/format'

interface Props {
  vehicleA: VehicleConfig
  vehicleB: VehicleConfig
  resultA: VehicleResult
  resultB: VehicleResult
}

interface TooltipPayloadItem {
  dataKey: string
  value: number
  color: string
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  const total = payload.reduce((sum, p) => sum + p.value, 0)
  return (
    <div className="rounded-md border border-slate-200 bg-[var(--chart-surface)] px-3 py-2 text-xs shadow-lg dark:border-slate-700">
      <p className="mb-1 font-semibold text-[var(--chart-text-primary)]">{label}</p>
      {payload
        .slice()
        .reverse()
        .map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[var(--chart-text-secondary)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
              {CATEGORY_LABELS[p.dataKey as keyof typeof CATEGORY_LABELS]}
            </span>
            <span className="tabular-nums text-[var(--chart-text-primary)]">{formatEuro(p.value)}</span>
          </div>
        ))}
      <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-200 pt-1 font-semibold text-[var(--chart-text-primary)] dark:border-slate-700">
        <span>Total</span>
        <span className="tabular-nums">{formatEuro(total)}</span>
      </div>
    </div>
  )
}

export function CostBreakdownChart({ vehicleA, vehicleB, resultA, resultB }: Props) {
  const data = [
    { name: vehicleA.label, ...resultA.breakdown },
    { name: vehicleB.label, ...resultB.breakdown },
  ]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Décomposition des coûts par poste
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="0" horizontal={false} stroke="var(--chart-grid)" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatEuro(v)}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-text-secondary)', fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }} />
          <Legend
            itemSorter={null}
            formatter={(value: string) => (
              <span className="text-xs text-[var(--chart-text-secondary)]">
                {CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS]}
              </span>
            )}
          />
          {CATEGORY_ORDER.map((cat) => (
            <Bar key={cat} dataKey={cat} stackId="cost" fill={CATEGORY_COLORS[cat]} radius={0} maxBarSize={40} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
