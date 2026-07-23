import type { Financing, FinancingMode } from '../../types/scenario'
import { createFinancingDefaults } from '../../data/defaults'
import { CheckboxField, NumberField, SelectField } from './Field'

const MODE_OPTIONS: { value: FinancingMode; label: string }[] = [
  { value: 'cash', label: 'Achat comptant' },
  { value: 'credit', label: 'Crédit classique' },
  { value: 'loa', label: 'LOA (avec option d\'achat)' },
  { value: 'ldd', label: 'LDD / LLD (location longue durée)' },
]

interface Props {
  purchasePrice: number
  onPurchasePriceChange: (v: number) => void
  financing: Financing
  onFinancingChange: (f: Financing) => void
}

export function FinancingFields({ purchasePrice, onPurchasePriceChange, financing, onFinancingChange }: Props) {
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
      <SelectField label="Mode d'acquisition" value={financing.mode} onChange={handleModeChange} options={MODE_OPTIONS} />

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
            onChange={(v) => onFinancingChange({ ...financing, loanDurationMonths: v })}
            suffix="mois"
            step={1}
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
          />
          <NumberField
            label="Loyer mensuel"
            value={financing.monthlyPayment}
            onChange={(v) => onFinancingChange({ ...financing, monthlyPayment: v })}
            suffix="€/mois"
          />
          <NumberField
            label="Durée du contrat"
            value={financing.contractDurationMonths}
            onChange={(v) => onFinancingChange({ ...financing, contractDurationMonths: v })}
            suffix="mois"
          />
          <NumberField
            label="Kilométrage contractuel annuel"
            value={financing.contractualAnnualMileageKm}
            onChange={(v) => onFinancingChange({ ...financing, contractualAnnualMileageKm: v })}
            suffix="km/an"
            step={1000}
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
              />
              {financing.endOfContractAction === 'buyout' && (
                <>
                  <NumberField
                    label="Valeur de l'option d'achat"
                    value={financing.buybackValue}
                    onChange={(v) => onFinancingChange({ ...financing, buybackValue: v })}
                    suffix="€"
                    step={100}
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
            />
          )}
        </>
      )}
    </>
  )
}
