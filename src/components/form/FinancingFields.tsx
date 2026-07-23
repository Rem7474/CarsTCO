import type { Financing, FinancingMode, FiscalConfig } from '../../types/scenario'
import { createFinancingDefaults } from '../../data/defaults'
import { estimateLoaMonthlyPayment } from '../../lib/loaEstimate'
import { formatEuro } from '../../lib/format'
import { CheckboxField, NumberField, SelectField } from './Field'

const MODE_OPTIONS: { value: FinancingMode; label: string }[] = [
  { value: 'cash', label: 'Achat comptant' },
  { value: 'credit', label: 'Crédit classique' },
  { value: 'loa', label: 'LOA (avec option d\'achat)' },
  { value: 'ldd', label: 'LDD / LLD (location longue durée)' },
]

const MODE_HELP =
  "Comptant : payé cash, vous êtes propriétaire immédiatement. Crédit : emprunt classique, vous êtes propriétaire dès le départ. LOA : location avec option d'achat en fin de contrat. LDD/LLD : location sans option d'achat, à restituer ou reconduire."

interface Props {
  purchasePrice: number
  onPurchasePriceChange: (v: number) => void
  financing: Financing
  onFinancingChange: (f: Financing) => void
  fiscal: FiscalConfig
}

export function FinancingFields({ purchasePrice, onPurchasePriceChange, financing, onFinancingChange, fiscal }: Props) {
  const firstPaymentHelp =
    fiscal.bonus > 0
      ? `Dont ${formatEuro(fiscal.bonus)} de bonus écologique, généralement déduit directement par le concessionnaire.`
      : fiscal.malus > 0
        ? `Majoré en pratique du malus écologique (${formatEuro(fiscal.malus)}), voir la section Fiscalité ci-dessous.`
        : undefined

  const handleModeChange = (mode: FinancingMode) => {
    if (mode === financing.mode) return
    onFinancingChange(createFinancingDefaults(mode, purchasePrice))
  }

  return (
    <>
      <NumberField
        label="Prix d'achat catalogue"
        value={purchasePrice}
        onChange={onPurchasePriceChange}
        suffix="€"
        step={100}
      />
      <SelectField
        label="Mode d'acquisition"
        value={financing.mode}
        onChange={handleModeChange}
        options={MODE_OPTIONS}
        help={MODE_HELP}
      />

      {financing.mode === 'cash' && (
        <>
          <NumberField
            label="Frais de carte grise"
            value={financing.carteGriseCost}
            onChange={(v) => onFinancingChange({ ...financing, carteGriseCost: v })}
            suffix="€"
          />
          <NumberField
            label="Valeur de revente estimée en fin de détention"
            value={financing.resaleValueAtEnd}
            onChange={(v) => onFinancingChange({ ...financing, resaleValueAtEnd: v })}
            suffix="€"
            step={100}
          />
        </>
      )}

      {financing.mode === 'credit' && (
        <>
          <NumberField
            label="Apport"
            value={financing.downPayment}
            onChange={(v) => onFinancingChange({ ...financing, downPayment: v })}
            suffix="€"
            step={100}
          />
          <NumberField
            label="Taux d'intérêt annuel"
            value={financing.annualInterestRatePct}
            onChange={(v) => onFinancingChange({ ...financing, annualInterestRatePct: v })}
            suffix="%"
            step={0.1}
          />
          <NumberField
            label="Durée du prêt"
            value={financing.loanDurationMonths}
            onChange={(v) => onFinancingChange({ ...financing, loanDurationMonths: Math.max(1, v) })}
            suffix="mois"
            step={1}
            min={1}
          />
          <NumberField
            label="Frais de carte grise"
            value={financing.carteGriseCost}
            onChange={(v) => onFinancingChange({ ...financing, carteGriseCost: v })}
            suffix="€"
          />
          <NumberField
            label="Valeur de revente estimée en fin de détention"
            value={financing.resaleValueAtEnd}
            onChange={(v) => onFinancingChange({ ...financing, resaleValueAtEnd: v })}
            suffix="€"
            step={100}
          />
        </>
      )}

      {(financing.mode === 'loa' || financing.mode === 'ldd') && (
        <>
          <NumberField
            label="Premier loyer / apport"
            value={financing.firstPayment}
            onChange={(v) => onFinancingChange({ ...financing, firstPayment: v })}
            suffix="€"
            step={100}
            help={firstPaymentHelp}
          />

          {financing.mode === 'loa' && financing.autoCalculate ? (
            <div className="flex flex-col gap-1.5 text-[13px]">
              <span className="font-semibold text-ink-soft">Loyer mensuel (calculé)</span>
              <div className="rounded-[10px] border border-dashed border-teal bg-teal-tint px-3 py-[9px] font-bold text-teal-deep">
                {formatEuro(
                  estimateLoaMonthlyPayment({
                    purchasePrice,
                    firstPayment: financing.firstPayment,
                    buybackValue: financing.buybackValue,
                    annualInterestRatePct: financing.annualInterestRatePct,
                    contractDurationMonths: financing.contractDurationMonths,
                  }),
                )}
                /mois
              </div>
              <span className="text-xs text-muted-2">
                Estimation à partir du prix, de l'option d'achat, du taux et de la durée.
              </span>
            </div>
          ) : (
            <NumberField
              label="Loyer mensuel"
              value={financing.monthlyPayment}
              onChange={(v) => onFinancingChange({ ...financing, monthlyPayment: v })}
              suffix="€/mois"
            />
          )}

          {financing.mode === 'loa' && (
            <>
              <CheckboxField
                label="Calculer automatiquement le loyer"
                checked={financing.autoCalculate}
                onChange={(v) => onFinancingChange({ ...financing, autoCalculate: v })}
                help="À partir du prix, du taux d'intérêt, de l'option d'achat et de la durée, plutôt que saisi à la main."
              />
              {financing.autoCalculate && (
                <NumberField
                  label="Taux d'intérêt annuel"
                  value={financing.annualInterestRatePct}
                  onChange={(v) => onFinancingChange({ ...financing, annualInterestRatePct: v })}
                  suffix="%"
                  step={0.1}
                />
              )}
            </>
          )}

          <NumberField
            label="Durée du contrat"
            value={financing.contractDurationMonths}
            onChange={(v) => onFinancingChange({ ...financing, contractDurationMonths: Math.max(1, v) })}
            suffix="mois"
            min={1}
          />
          <NumberField
            label="Kilométrage contractuel annuel"
            value={financing.contractualAnnualMileageKm}
            onChange={(v) => onFinancingChange({ ...financing, contractualAnnualMileageKm: v })}
            suffix="km/an"
            step={1000}
            help="Le forfait km/an prévu au contrat — un dépassement déclenche le coût ci-dessous."
          />
          <NumberField
            label="Coût du dépassement kilométrique"
            value={financing.excessMileageCostPerKm}
            onChange={(v) => onFinancingChange({ ...financing, excessMileageCostPerKm: v })}
            suffix="€/km"
            step={0.01}
          />
          <NumberField
            label="Remise en cas de sous-utilisation"
            value={financing.underMileageRefundPerKm}
            onChange={(v) => onFinancingChange({ ...financing, underMileageRefundPerKm: v })}
            suffix="€/km"
            step={0.01}
            help="Souvent nulle en pratique — laissez à 0 si non applicable."
          />
          <NumberField
            label="Frais de restitution"
            value={financing.restitutionFees}
            onChange={(v) => onFinancingChange({ ...financing, restitutionFees: v })}
            suffix="€"
            help="Frais facturés au retour du véhicule en fin de contrat (hors levée d'option)."
          />
          <CheckboxField
            label="Entretien inclus dans le loyer"
            checked={financing.maintenanceIncluded}
            onChange={(v) => onFinancingChange({ ...financing, maintenanceIncluded: v })}
            help="Évite de compter l'entretien en double."
          />
          <CheckboxField
            label="Assurance incluse dans le loyer"
            checked={financing.insuranceIncluded}
            onChange={(v) => onFinancingChange({ ...financing, insuranceIncluded: v })}
            help="Évite de compter l'assurance en double."
          />

          {financing.mode === 'loa' ? (
            <>
              <SelectField
                label="Fin de contrat"
                value={financing.endOfContractAction}
                onChange={(v) => onFinancingChange({ ...financing, endOfContractAction: v })}
                options={[
                  { value: 'buyout', label: "Lever l'option d'achat" },
                  { value: 'renew', label: 'Reconduire un nouveau contrat' },
                  { value: 'return', label: 'Restituer le véhicule' },
                ]}
                help="La levée d'option n'est prise en compte que si la durée de détention tombe exactement en fin de contrat."
              />
              {financing.endOfContractAction === 'buyout' && (
                <>
                  <NumberField
                    label="Valeur de l'option d'achat"
                    value={financing.buybackValue}
                    onChange={(v) => onFinancingChange({ ...financing, buybackValue: v })}
                    suffix="€"
                    step={100}
                    help="Prix à payer pour devenir propriétaire à la fin du contrat."
                  />
                  <NumberField
                    label="Valeur de revente estimée après rachat"
                    value={financing.estimatedResaleValueAfterBuyout}
                    onChange={(v) => onFinancingChange({ ...financing, estimatedResaleValueAfterBuyout: v })}
                    suffix="€"
                    step={100}
                    help="Si le véhicule est revendu juste après la levée d'option."
                  />
                </>
              )}
            </>
          ) : (
            <SelectField
              label="Fin de contrat"
              value={financing.endOfContractAction}
              onChange={(v) => onFinancingChange({ ...financing, endOfContractAction: v })}
              options={[
                { value: 'renew', label: 'Reconduire un nouveau contrat' },
                { value: 'return', label: 'Restituer le véhicule' },
              ]}
              help="La LDD ne propose pas d'option d'achat, contrairement à la LOA."
            />
          )}
        </>
      )}
    </>
  )
}
