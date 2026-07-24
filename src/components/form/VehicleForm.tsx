import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CostCategory,
  ElectricEnergyConfig,
  EnergyType,
  ThermalEnergyConfig,
  VehicleConfig,
} from '../../types/scenario'
import { createEnergyDefaults } from '../../data/defaults'
import { VEHICLE_TEMPLATES } from '../../data/vehicleTemplates'
import { getVehicleWarnings } from '../../lib/validation'
import { ENERGY_ACCENT } from '../../lib/chartColors'
import { formatEuro, formatEuroPrecise } from '../../lib/format'
import { NumberField, SelectField, TextField } from './Field'
import { FinancingFields } from './FinancingFields'
import { EnergyFields } from './EnergyFields'

interface Props {
  vehicle: VehicleConfig
  holdingYears: number
  annualMileageKm: number
  onChange: (updater: (v: VehicleConfig) => VehicleConfig) => void
  onRemove?: () => void
}

const ENERGY_OPTIONS: { value: EnergyType; label: string }[] = [
  { value: 'thermal', label: 'Thermique' },
  { value: 'electric', label: 'Électrique' },
]

const TEMPLATE_PLACEHOLDER = '__custom__'
const TEMPLATE_OPTIONS = [
  { value: TEMPLATE_PLACEHOLDER, label: '— Modèle type (optionnel) —' },
  ...VEHICLE_TEMPLATES.map((t) => ({ value: t.id, label: t.label })),
]

const STEPS: { key: CostCategory; label: string }[] = [
  { key: 'financement', label: 'Financement' },
  { key: 'energie', label: 'Énergie' },
  { key: 'entretien', label: 'Entretien' },
  { key: 'pneus', label: 'Pneus' },
  { key: 'assurance', label: 'Assurance' },
]

const END_OF_CONTRACT_LABELS: Record<string, string> = {
  buyout: "Lever l'option d'achat",
  renew: 'Reconduire un nouveau contrat',
  return: 'Restituer le véhicule',
}

/**
 * Scrolls to `target`, clearing the sticky header. Measures the header's actual rendered
 * height instead of a hard-coded offset, since it's a different height on mobile than desktop.
 */
function scrollBelowStickyHeader(target: HTMLElement | null): void {
  if (!target) return
  const header = document.querySelector('header')
  const offset = (header?.getBoundingClientRect().height ?? 0) + 12
  const top = target.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

const fmtNum = (v: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(v)

/** Short "at a glance" chip text for a category, shown while a different step is active. Null skips the chip. */
function summaryChip(vehicle: VehicleConfig, category: CostCategory, isLease: boolean): string | null {
  const f = vehicle.financing

  switch (category) {
    case 'energie':
      if (vehicle.energyType === 'thermal') {
        const e = vehicle.energy as ThermalEnergyConfig
        return `Énergie · ${fmtNum(e.consumptionL100km)} L/100km · ${formatEuroPrecise(e.fuelPricePerLiter)}/L`
      } else {
        const e = vehicle.energy as ElectricEnergyConfig
        const avgPrice = (e.homePricePerKwh * e.homeChargeSharePct + e.publicPricePerKwh * (100 - e.homeChargeSharePct)) / 100
        return `Énergie · ${fmtNum(e.consumptionKwh100km)} kWh/100km · ${formatEuroPrecise(avgPrice)}/kWh moy.`
      }
    case 'entretien':
      if (isLease && 'maintenanceIncluded' in f && f.maintenanceIncluded) return null
      return `Entretien · ${formatEuro(vehicle.maintenanceAnnualCost)}/an`
    case 'pneus':
      return `Pneus · ${formatEuro(vehicle.tireSetPrice)} / ${fmtNum(vehicle.tireLifespanKm, 0)} km`
    case 'assurance':
      if (isLease && 'insuranceIncluded' in f && f.insuranceIncluded) return null
      return `Assurance · ${formatEuro(vehicle.insuranceAnnualPremium)}/an`
    case 'fiscalite':
      // Folded into the "financement" step — not a standalone step anymore, see below.
      return null
    case 'financement':
      if (vehicle.energyType === 'thermal') {
        return vehicle.fiscal.malus > 0 ? `Malus · ${formatEuro(vehicle.fiscal.malus)}` : null
      }
      return vehicle.fiscal.bonus > 0 ? `Bonus · ${formatEuro(vehicle.fiscal.bonus)}` : null
  }
}

export function VehicleForm({ vehicle, holdingYears, annualMileageKm, onChange, onRemove }: Props) {
  const [step, setStep] = useState(0)
  const accent = ENERGY_ACCENT[vehicle.energyType]
  const isLease = vehicle.financing.mode === 'loa' || vehicle.financing.mode === 'ldd'
  const warnings = getVehicleWarnings(vehicle, { holdingYears, annualMileageKm })

  const cardRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Step content height varies a lot (Financement vs Pneus) — anchor the view on every
    // change so "Suivant"/"Précédent" stay at a predictable spot. On desktop the vehicle
    // cards sit side by side, so re-anchoring on the whole "Véhicules" section reads better
    // than jumping inside a single card; on mobile (single column, and the sticky header
    // already eats vertical space) re-anchoring on this card's own top keeps it in view.
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    const target = isDesktop ? document.getElementById('vehicules') : cardRef.current
    scrollBelowStickyHeader(target)
  }, [step])

  const handleTemplateChange = (templateId: string) => {
    if (templateId === TEMPLATE_PLACEHOLDER) return
    const template = VEHICLE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    onChange((veh) => template.apply(veh.id))
  }

  const current = STEPS[step]
  const f = vehicle.financing

  return (
    <div ref={cardRef} className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-white">
      <div className="px-[22px] py-[18px]" style={{ background: accent.tint }}>
        <div className="mb-3 flex items-center justify-between gap-2.5">
          <span
            className="rounded-full px-2.5 py-1 text-[11.5px] font-bold tracking-wide text-white"
            style={{ background: accent.base }}
          >
            {vehicle.energyType === 'electric' ? 'ÉLECTRIQUE' : 'THERMIQUE'}
          </span>
          {onRemove && (
            <button
              type="button"
              className="rounded text-[12.5px] font-semibold text-[#8C6F5E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              onClick={onRemove}
              aria-label="Retirer ce véhicule de la comparaison"
            >
              Retirer ✕
            </button>
          )}
        </div>
        <TextField
          label="Nom du véhicule"
          value={vehicle.label}
          onChange={(v) => onChange((veh) => ({ ...veh, label: v }))}
          visuallyHiddenLabel
          className="w-full border-none bg-transparent p-0 font-display text-[22px] font-extrabold outline-none"
          style={{ color: accent.deep }}
        />
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <select
            className="rounded-full border bg-white px-3 py-[5px] text-[12.5px] font-semibold outline-none"
            style={{ borderColor: accent.border, color: accent.dark }}
            value={TEMPLATE_PLACEHOLDER}
            onChange={(e) => handleTemplateChange(e.target.value)}
            aria-label="Partir d'un modèle type"
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === TEMPLATE_PLACEHOLDER ? `Modèle type : ${vehicle.label}` : opt.label}
              </option>
            ))}
          </select>
          <SelectField
            label="Type d'énergie"
            value={vehicle.energyType}
            onChange={(v) =>
              onChange((veh) => ({
                ...veh,
                energyType: v,
                energy: createEnergyDefaults(v),
              }))
            }
            options={ENERGY_OPTIONS}
            visuallyHiddenLabel
            compact
          />
        </div>
      </div>

      <div className="px-[22px] pt-4">
        <div className="mb-2 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <StepDot key={s.key} index={i} step={step} accent={accent} onSelect={() => setStep(i)} isLast={i === STEPS.length - 1} />
          ))}
        </div>
        <div className="flex justify-between border-b border-border-soft pb-3.5 text-[10.5px] text-muted-2">
          {STEPS.map((s, i) => (
            <span key={s.key} style={i === step ? { color: accent.base, fontWeight: 700 } : undefined}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-[22px] py-5">
        <div className="text-sm font-bold" style={{ color: accent.deep }}>
          Étape {step + 1} sur {STEPS.length} — {current.label}
        </div>

        <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
          {current.key === 'financement' && (
            <>
              <FinancingFields
                purchasePrice={vehicle.purchasePrice}
                onPurchasePriceChange={(v) => onChange((veh) => ({ ...veh, purchasePrice: v }))}
                financing={vehicle.financing}
                onFinancingChange={(fin) => onChange((veh) => ({ ...veh, financing: fin }))}
                fiscal={vehicle.fiscal}
              />
              {vehicle.energyType === 'thermal' && (
                <NumberField
                  label="Malus écologique / au poids"
                  value={vehicle.fiscal.malus}
                  onChange={(v) => onChange((veh) => ({ ...veh, fiscal: { ...veh.fiscal, malus: v } }))}
                  suffix="€"
                  step={10}
                  help={isLease ? "Payé une fois, généralement ajouté au premier loyer par le concessionnaire." : undefined}
                />
              )}
              {vehicle.energyType === 'electric' && (
                <NumberField
                  label="Bonus écologique"
                  value={vehicle.fiscal.bonus}
                  onChange={(v) => onChange((veh) => ({ ...veh, fiscal: { ...veh.fiscal, bonus: v } }))}
                  suffix="€"
                  step={10}
                  help={
                    isLease
                      ? "Soumis à conditions de revenu depuis 2025 — généralement déduit directement du premier loyer par le concessionnaire."
                      : "Soumis à conditions de revenu depuis 2025 — vérifiez votre éligibilité."
                  }
                />
              )}
              {isLease && (
                <p className="sm:col-span-2 text-xs text-muted-2">
                  La carte grise reste supposée incluse dans le loyer et n'est pas comptée séparément en LOA/LDD.
                </p>
              )}
            </>
          )}

          {current.key === 'energie' && (
            <EnergyFields
              energyType={vehicle.energyType}
              energy={vehicle.energy}
              onChange={(e) => onChange((veh) => ({ ...veh, energy: e }))}
            />
          )}

          {current.key === 'entretien' &&
            (isLease && 'maintenanceIncluded' in f && f.maintenanceIncluded ? (
              <p className="sm:col-span-2 text-sm text-muted">
                Entretien inclus dans le loyer — champ ignoré pour éviter un double comptage.
              </p>
            ) : (
              <NumberField
                label="Coût d'entretien annuel moyen"
                value={vehicle.maintenanceAnnualCost}
                onChange={(v) => onChange((veh) => ({ ...veh, maintenanceAnnualCost: v }))}
                suffix="€/an"
                step={10}
              />
            ))}

          {current.key === 'pneus' && (
            <>
              <NumberField
                label="Prix d'un train de pneus (4)"
                value={vehicle.tireSetPrice}
                onChange={(v) => onChange((veh) => ({ ...veh, tireSetPrice: v }))}
                suffix="€"
                step={10}
              />
              <NumberField
                label="Durée de vie des pneus"
                value={vehicle.tireLifespanKm}
                onChange={(v) => onChange((veh) => ({ ...veh, tireLifespanKm: Math.max(1, v) }))}
                suffix="km"
                step={1000}
                min={1000}
              />
            </>
          )}

          {current.key === 'assurance' &&
            (isLease && 'insuranceIncluded' in f && f.insuranceIncluded ? (
              <p className="sm:col-span-2 text-sm text-muted">
                Assurance incluse dans le loyer — champ ignoré pour éviter un double comptage.
              </p>
            ) : (
              <NumberField
                label="Prime d'assurance annuelle"
                value={vehicle.insuranceAnnualPremium}
                onChange={(v) => onChange((veh) => ({ ...veh, insuranceAnnualPremium: v }))}
                suffix="€/an"
                step={10}
              />
            ))}

        </div>

        {current.key === 'financement' && isLease && 'maintenanceIncluded' in f && (
          <div className="flex flex-wrap gap-2">
            {f.maintenanceIncluded && <Chip>Entretien inclus ✓</Chip>}
            {f.insuranceIncluded && <Chip>Assurance incluse ✓</Chip>}
            <Chip>Fin de contrat : {END_OF_CONTRACT_LABELS[f.endOfContractAction]}</Chip>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {step > 0 ? (
            <button
              type="button"
              className="text-[13px] font-semibold text-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              ← Précédent
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="rounded-[10px] border-none px-5 py-2.5 text-[13.5px] font-bold text-white focus:outline-none focus-visible:ring-2"
              style={{ background: accent.base }}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              Suivant : {STEPS[step + 1].label} →
            </button>
          ) : (
            <span className="text-[13px] font-semibold" style={{ color: accent.base }}>
              Configuration complète ✓
            </span>
          )}
        </div>

        {(() => {
          const chips = STEPS.filter((s) => s.key !== current.key)
            .map((s) => summaryChip(vehicle, s.key, isLease))
            .filter((c): c is string => c !== null)
          if (chips.length === 0) return null
          return (
            <div className="mt-0.5 flex flex-wrap gap-2 border-t border-border-soft pt-3">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-chip px-3 py-1.5 text-xs text-muted-3">
                  {chip}
                </span>
              ))}
            </div>
          )
        })()}
      </div>

      {warnings.length > 0 && (
        <div className="mx-[22px] mb-5 rounded-2xl border border-amber-border bg-amber-bg px-4 py-3 text-sm text-amber-text">
          <p className="mb-1 flex items-center gap-1.5 font-bold">
            <span aria-hidden="true">⚠️</span> Incohérences potentielles
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink-soft">{children}</span>
}

function StepDot({
  index,
  step,
  accent,
  onSelect,
  isLast,
}: {
  index: number
  step: number
  accent: { base: string }
  onSelect: () => void
  isLast: boolean
}) {
  const state = index < step ? 'done' : index === step ? 'current' : 'pending'
  return (
    <>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Aller à l'étape ${index + 1} : ${STEPS[index].label}`}
        aria-current={state === 'current' ? 'step' : undefined}
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        style={
          state === 'pending'
            ? { border: '1.5px solid #D3CBB4', color: '#9A927E', background: 'transparent' }
            : { background: accent.base, color: '#fff' }
        }
      >
        {index + 1}
      </button>
      {!isLast && (
        <div className="h-[2px] flex-1" style={{ background: index < step ? accent.base : '#E6DFCD' }} />
      )}
    </>
  )
}
