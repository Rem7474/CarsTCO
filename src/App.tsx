import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { ScenarioConfig, VehicleConfig } from './types/scenario'
import { createDefaultScenario, createVehicleVariant, MAX_VEHICLES, MIN_VEHICLES } from './data/defaults'
import { computeVehicleResult } from './lib/calculations'
import { loadScenarioFromLocalStorage, loadScenarioFromUrl, saveScenarioToLocalStorage } from './lib/persistence'
import { getVehicleColor } from './lib/chartColors'
import { ScenarioSettings } from './components/ScenarioSettings'
import { ExportImport } from './components/ExportImport'
import { ConfirmDialog } from './components/ConfirmDialog'
import { VehicleForm } from './components/form/VehicleForm'
import { SummaryTable } from './components/results/SummaryTable'

const CostBreakdownChart = lazy(() =>
  import('./components/results/CostBreakdownChart').then((m) => ({ default: m.CostBreakdownChart })),
)
const BreakEvenChart = lazy(() =>
  import('./components/results/BreakEvenChart').then((m) => ({ default: m.BreakEvenChart })),
)

function ChartSkeleton() {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
      Chargement du graphique…
    </div>
  )
}

function initialScenario(): ScenarioConfig {
  return loadScenarioFromUrl() ?? loadScenarioFromLocalStorage() ?? createDefaultScenario()
}

function App() {
  const [scenario, setScenario] = useState<ScenarioConfig>(initialScenario)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  useEffect(() => {
    saveScenarioToLocalStorage(scenario)
  }, [scenario])

  const results = useMemo(
    () =>
      scenario.vehicles.map((vehicle) =>
        computeVehicleResult(vehicle, scenario.holdingYears, scenario.annualMileageKm),
      ),
    [scenario.vehicles, scenario.holdingYears, scenario.annualMileageKm],
  )

  const updateVehicle = (id: string, updater: (v: VehicleConfig) => VehicleConfig) =>
    setScenario((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) => (v.id === id ? updater(v) : v)),
    }))

  const addVehicle = () =>
    setScenario((s) => {
      if (s.vehicles.length >= MAX_VEHICLES) return s
      const basedOn = s.vehicles[s.vehicles.length - 1]
      const newVehicle = createVehicleVariant(basedOn, `Véhicule ${s.vehicles.length + 1}`)
      return { ...s, vehicles: [...s.vehicles, newVehicle] }
    })

  const removeVehicle = (id: string) =>
    setScenario((s) => {
      if (s.vehicles.length <= MIN_VEHICLES) return s
      return { ...s, vehicles: s.vehicles.filter((v) => v.id !== id) }
    })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 print:bg-white print:text-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">CarsTCO</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Comparateur de coût total de possession — Électrique vs Thermique
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportImport scenario={scenario} onImport={setScenario} />
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => window.print()}
            >
              Imprimer / PDF
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => setResetDialogOpen(true)}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={resetDialogOpen}
        title="Réinitialiser le scénario ?"
        message="Tous les véhicules et paramètres seront remplacés par les valeurs par défaut. Cette action est irréversible."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          setScenario(createDefaultScenario())
          setResetDialogOpen(false)
        }}
        onCancel={() => setResetDialogOpen(false)}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
        <div className="print:hidden">
          <ScenarioSettings
            holdingYears={scenario.holdingYears}
            annualMileageKm={scenario.annualMileageKm}
            onHoldingYearsChange={(v) => setScenario((s) => ({ ...s, holdingYears: Math.max(1, v) }))}
            onAnnualMileageChange={(v) => setScenario((s) => ({ ...s, annualMileageKm: Math.max(0, v) }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:hidden">
          {scenario.vehicles.map((vehicle, i) => (
            <VehicleForm
              key={vehicle.id}
              vehicle={vehicle}
              accentColor={getVehicleColor(i)}
              onChange={(updater) => updateVehicle(vehicle.id, updater)}
              onRemove={scenario.vehicles.length > MIN_VEHICLES ? () => removeVehicle(vehicle.id) : undefined}
            />
          ))}
        </div>

        <div className="print:hidden">
          <button
            className="rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            onClick={addVehicle}
            disabled={scenario.vehicles.length >= MAX_VEHICLES}
          >
            + Ajouter un véhicule à comparer
          </button>
          {scenario.vehicles.length >= MAX_VEHICLES && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Maximum {MAX_VEHICLES} véhicules pour garder les graphiques lisibles.
            </p>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Résultats</h2>
          <SummaryTable vehicles={scenario.vehicles} results={results} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Suspense fallback={<ChartSkeleton />}>
              <CostBreakdownChart vehicles={scenario.vehicles} results={results} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <BreakEvenChart scenario={scenario} />
            </Suspense>
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 print:hidden">
          Valeurs par défaut indicatives (marché français 2026) — ajustez chaque hypothèse selon votre situation.
        </footer>
      </main>
    </div>
  )
}

export default App
