import type { EnergyType, VehicleConfig } from '../../types/scenario'
import { createEnergyDefaults } from '../../data/defaults'
import { VEHICLE_TEMPLATES } from '../../data/vehicleTemplates'
import { getVehicleWarnings } from '../../lib/validation'
import { NumberField, Section, SelectField, TextField } from './Field'
import { FinancingFields } from './FinancingFields'
import { EnergyFields } from './EnergyFields'

interface Props {
  vehicle: VehicleConfig
  accentColor: string
  holdingYears: number
  annualMileageKm: number
  onChange: (updater: (v: VehicleConfig) => VehicleConfig) => void
  onRemove?: () => void
}

const ENERGY_OPTIONS: { value: EnergyType; label: string }[] = [
  { value: 'thermal', label: 'Thermique (essence/diesel)' },
  { value: 'electric', label: 'Électrique' },
]

const TEMPLATE_PLACEHOLDER = '__custom__'
const TEMPLATE_OPTIONS = [
  { value: TEMPLATE_PLACEHOLDER, label: '— Modèle type (optionnel) —' },
  ...VEHICLE_TEMPLATES.map((t) => ({ value: t.id, label: t.label })),
]

export function VehicleForm({ vehicle, accentColor, holdingYears, annualMileageKm, onChange, onRemove }: Props) {
  const isLease = vehicle.financing.mode === 'loa' || vehicle.financing.mode === 'ldd'
  const warnings = getVehicleWarnings(vehicle, { holdingYears, annualMileageKm })

  const handleTemplateChange = (templateId: string) => {
    if (templateId === TEMPLATE_PLACEHOLDER) return
    const template = VEHICLE_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    onChange((veh) => template.apply(veh.id))
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm dark:bg-slate-900"
        style={{ borderLeftColor: accentColor }}
      >
        {onRemove && (
          <button
            type="button"
            aria-label="Retirer ce véhicule de la comparaison"
            title="Retirer ce véhicule de la comparaison"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
            onClick={onRemove}
          >
            <span aria-hidden="true" className="text-base leading-none">
              ×
            </span>
          </button>
        )}
        <div className="grid grid-cols-1 gap-3 pr-8 sm:grid-cols-2">
          <TextField label="Nom du véhicule" value={vehicle.label} onChange={(v) => onChange((veh) => ({ ...veh, label: v }))} />
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
          />
          <div className="sm:col-span-2">
            <SelectField
              label="Partir d'un modèle type"
              value={TEMPLATE_PLACEHOLDER}
              onChange={handleTemplateChange}
              options={TEMPLATE_OPTIONS}
              help="Préremplit tous les champs de ce véhicule à partir d'un profil type — à ajuster ensuite librement."
            />
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <span aria-hidden="true">⚠️</span> Incohérences potentielles
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <Section title="Financement">
        <FinancingFields
          purchasePrice={vehicle.purchasePrice}
          onPurchasePriceChange={(v) => onChange((veh) => ({ ...veh, purchasePrice: v }))}
          financing={vehicle.financing}
          onFinancingChange={(f) => onChange((veh) => ({ ...veh, financing: f }))}
          fiscal={vehicle.fiscal}
        />
      </Section>

      <Section title="Énergie">
        <EnergyFields
          energyType={vehicle.energyType}
          energy={vehicle.energy}
          onChange={(e) => onChange((veh) => ({ ...veh, energy: e }))}
        />
      </Section>

      <Section title="Entretien" defaultOpen={!isLease || !('maintenanceIncluded' in vehicle.financing) || !vehicle.financing.maintenanceIncluded}>
        {isLease && 'maintenanceIncluded' in vehicle.financing && vehicle.financing.maintenanceIncluded ? (
          <p className="col-span-2 text-sm text-slate-500 dark:text-slate-400">
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
        )}
      </Section>

      <Section title="Pneus">
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
      </Section>

      <Section title="Assurance" defaultOpen={!isLease || !('insuranceIncluded' in vehicle.financing) || !vehicle.financing.insuranceIncluded}>
        {isLease && 'insuranceIncluded' in vehicle.financing && vehicle.financing.insuranceIncluded ? (
          <p className="col-span-2 text-sm text-slate-500 dark:text-slate-400">
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
        )}
      </Section>

      <Section title="Fiscalité (bonus/malus écologique)" defaultOpen>
        {vehicle.energyType === 'thermal' && (
          <NumberField
            label="Malus écologique / au poids"
            value={vehicle.fiscal.malus}
            onChange={(v) => onChange((veh) => ({ ...veh, fiscal: { ...veh.fiscal, malus: v } }))}
            suffix="€"
            step={10}
            help={
              isLease
                ? "Payé une fois, généralement ajouté au premier loyer par le concessionnaire."
                : undefined
            }
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
          <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500">
            La carte grise reste supposée incluse dans le loyer et n'est pas comptée séparément en LOA/LDD.
          </p>
        )}
      </Section>
    </div>
  )
}
