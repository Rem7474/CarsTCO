import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import type { ScenarioConfig, VehicleConfig } from './types/scenario'
import { createDefaultScenario, createVehicleVariant, MAX_VEHICLES, MIN_VEHICLES } from './data/defaults'
import { computeVehicleResult } from './lib/calculations'
import { loadScenarioFromLocalStorage, loadScenarioFromUrl, saveScenarioToLocalStorage } from './lib/persistence'
import { ScenarioSettings } from './components/ScenarioSettings'
import { ExportImport } from './components/ExportImport'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LiveComparisonRibbon } from './components/LiveComparisonRibbon'
import { VehicleForm } from './components/form/VehicleForm'
import { ResultsOverview } from './components/results/ResultsOverview'
import { SummaryTable } from './components/results/SummaryTable'
import { UsageCostTable } from './components/results/UsageCostTable'

const CostBreakdownChart = lazy(() =>
  import('./components/results/CostBreakdownChart').then((m) => ({ default: m.CostBreakdownChart })),
)
const BreakEvenChart = lazy(() =>
  import('./components/results/BreakEvenChart').then((m) => ({ default: m.BreakEvenChart })),
)

function ChartSkeleton() {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-border bg-white text-sm text-muted-2 shadow-sm">
      Chargement du graphique…
    </div>
  )
}

function initialScenario(): ScenarioConfig {
  return loadScenarioFromUrl() ?? loadScenarioFromLocalStorage() ?? createDefaultScenario()
}

const headerButtonClass =
  'rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-soft shadow-sm hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-teal'

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
    <div className="min-h-screen bg-cream font-sans text-ink print:bg-white">
      <header className="sticky top-0 z-20 border-b border-border bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-teal font-display text-lg font-extrabold text-white">
              C
            </div>
            <div>
              <h1 className="font-display text-[19px] font-extrabold leading-tight text-ink">CarsTCO</h1>
              <p className="text-[12.5px] text-muted">Coût total de possession — Électrique vs Thermique</p>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-sm font-semibold text-muted">
            <a href="#usage" className="text-muted hover:text-teal">
              Usage
            </a>
            <a href="#vehicules" className="text-muted hover:text-teal">
              Véhicules
            </a>
            <a href="#resultats" className="text-muted hover:text-teal">
              Résultats
            </a>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <ExportImport scenario={scenario} onImport={setScenario} />
            <button className={headerButtonClass} onClick={() => window.print()}>
              Imprimer / PDF
            </button>
            <button
              className="rounded px-1.5 text-[13px] font-semibold text-muted underline-offset-2 hover:text-red-text hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              onClick={() => setResetDialogOpen(true)}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </header>

      <LiveComparisonRibbon vehicles={scenario.vehicles} results={results} />

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

      <main className="mx-auto flex max-w-6xl flex-col gap-9 px-4 py-8 pb-16">
        <section id="usage" className="print:hidden">
          <ScenarioSettings
            holdingYears={scenario.holdingYears}
            annualMileageKm={scenario.annualMileageKm}
            onHoldingYearsChange={(v) => setScenario((s) => ({ ...s, holdingYears: Math.max(1, v) }))}
            onAnnualMileageChange={(v) => setScenario((s) => ({ ...s, annualMileageKm: Math.max(0, v) }))}
          />
        </section>

        <section id="vehicules" className="flex flex-col gap-4 print:hidden">
          <div>
            <h2 className="font-display text-[19px] font-bold text-ink">Véhicules comparés</h2>
            <p className="text-[13.5px] text-muted">
              Thermique, électrique, ou les deux — configurez librement chaque véhicule.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {scenario.vehicles.map((vehicle) => (
              <VehicleForm
                key={vehicle.id}
                vehicle={vehicle}
                holdingYears={scenario.holdingYears}
                annualMileageKm={scenario.annualMileageKm}
                onChange={(updater) => updateVehicle(vehicle.id, updater)}
                onRemove={scenario.vehicles.length > MIN_VEHICLES ? () => removeVehicle(vehicle.id) : undefined}
              />
            ))}
          </div>

          <button
            className="self-start rounded-[14px] border-[1.5px] border-dashed border-dash px-5 py-3 text-sm font-bold text-muted hover:border-teal hover:text-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-50"
            onClick={addVehicle}
            disabled={scenario.vehicles.length >= MAX_VEHICLES}
          >
            + Ajouter un véhicule à comparer
          </button>
          {scenario.vehicles.length >= MAX_VEHICLES && (
            <p className="-mt-2 text-xs text-muted-2">Maximum {MAX_VEHICLES} véhicules pour garder les graphiques lisibles.</p>
          )}
        </section>

        <section id="resultats" className="flex flex-col gap-[18px]">
          <div>
            <h2 className="font-display text-[19px] font-bold text-ink">Résultats</h2>
            <p className="text-[13.5px] text-muted">
              Sur {scenario.holdingYears} ans et {(scenario.holdingYears * scenario.annualMileageKm).toLocaleString('fr-FR')} km
              — synthèse, coût d'usage pur et seuil de rentabilité.
            </p>
          </div>

          <ResultsOverview vehicles={scenario.vehicles} results={results} />
          <Suspense fallback={<ChartSkeleton />}>
            <CostBreakdownChart vehicles={scenario.vehicles} results={results} />
          </Suspense>
          <UsageCostTable
            vehicles={scenario.vehicles}
            results={results}
            totalKm={scenario.holdingYears * scenario.annualMileageKm}
          />
          <Suspense fallback={<ChartSkeleton />}>
            <BreakEvenChart scenario={scenario} />
          </Suspense>
          <SummaryTable vehicles={scenario.vehicles} results={results} />
        </section>

        <footer className="pt-3 text-center text-xs text-muted-2 print:hidden">
          Valeurs par défaut indicatives (marché français 2026) — ajustez chaque hypothèse selon votre situation.
        </footer>
      </main>
    </div>
  )
}

export default App
