import type { ElectricEnergyConfig, VehicleConfig } from '../types/scenario'
import { estimateLoaMonthlyPayment } from './loaEstimate'

interface UsageContext {
  holdingYears: number
  annualMileageKm: number
}

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')

/**
 * Non-blocking sanity checks on a single vehicle's manual inputs. Returns human-readable
 * warnings to surface in the form — nothing here prevents the calculation from running.
 */
export function getVehicleWarnings(vehicle: VehicleConfig, usage: UsageContext): string[] {
  const warnings: string[] = []
  const f = vehicle.financing

  if (f.mode === 'cash' || f.mode === 'credit') {
    if (f.resaleValueAtEnd > vehicle.purchasePrice) {
      warnings.push("La valeur de revente dépasse le prix d'achat catalogue.")
    }
    if (f.resaleValueAtEnd < 0) {
      warnings.push('La valeur de revente est négative.')
    }
  }

  if (f.mode === 'credit') {
    if (f.annualInterestRatePct < 0) {
      warnings.push("Le taux d'intérêt est négatif.")
    } else if (f.annualInterestRatePct > 20) {
      warnings.push("Le taux d'intérêt dépasse 20 % — vérifiez la saisie.")
    }
    if (f.downPayment > vehicle.purchasePrice) {
      warnings.push("L'apport dépasse le prix d'achat catalogue.")
    }
  }

  if (f.mode === 'loa' || f.mode === 'ldd') {
    if (f.firstPayment > vehicle.purchasePrice) {
      warnings.push('Le premier loyer dépasse le prix catalogue.')
    }
    if (f.contractualAnnualMileageKm > 0 && usage.annualMileageKm > 0) {
      const ratio = usage.annualMileageKm / f.contractualAnnualMileageKm
      if (ratio > 1.5) {
        warnings.push(
          `Le kilométrage réel (${fmt(usage.annualMileageKm)} km/an) dépasse largement le forfait contractuel ` +
            `(${fmt(f.contractualAnnualMileageKm)} km/an) — des frais de dépassement importants sont à prévoir.`,
        )
      } else if (ratio < 0.5) {
        warnings.push(
          `Le forfait contractuel (${fmt(f.contractualAnnualMileageKm)} km/an) est très supérieur au kilométrage ` +
            `réel — vous payez peut-être pour des kilomètres inutilisés.`,
        )
      }
    }
    const numContracts = Math.ceil((usage.holdingYears * 12) / Math.max(1, f.contractDurationMonths))
    if (numContracts >= 3) {
      warnings.push(
        `La durée de détention implique ${numContracts} contrats successifs simulés — vérifiez que c'est bien votre intention.`,
      )
    }
  }

  if (f.mode === 'loa') {
    if (f.buybackValue > vehicle.purchasePrice) {
      warnings.push("La valeur de l'option d'achat dépasse le prix catalogue.")
    }
    if (!f.autoCalculate) {
      const estimated = estimateLoaMonthlyPayment({
        purchasePrice: vehicle.purchasePrice,
        firstPayment: f.firstPayment,
        buybackValue: f.buybackValue,
        annualInterestRatePct: f.annualInterestRatePct,
        contractDurationMonths: f.contractDurationMonths,
      })
      if (estimated > 20 && (f.monthlyPayment < estimated * 0.5 || f.monthlyPayment > estimated * 1.8)) {
        warnings.push(
          `Le loyer saisi (${fmt(f.monthlyPayment)} €/mois) est très éloigné d'une estimation basée sur le prix, ` +
            `l'option d'achat, le taux et la durée (≈ ${fmt(estimated)} €/mois) — vérifiez la saisie, ou activez le ` +
            `calcul automatique.`,
        )
      }
    }
  }

  if (vehicle.tireLifespanKm > 0 && vehicle.tireLifespanKm < 5000) {
    warnings.push('La durée de vie des pneus semble anormalement basse (< 5 000 km).')
  }
  if (vehicle.maintenanceAnnualCost < 0) {
    warnings.push("Le coût d'entretien annuel est négatif.")
  }
  if (vehicle.insuranceAnnualPremium < 0) {
    warnings.push("La prime d'assurance est négative.")
  }
  if (vehicle.fiscal.malus < 0 || vehicle.fiscal.bonus < 0) {
    warnings.push('Le malus ou le bonus écologique est négatif.')
  }

  if (vehicle.energyType === 'electric') {
    const share = (vehicle.energy as ElectricEnergyConfig).homeChargeSharePct
    if (share < 0 || share > 100) {
      warnings.push('La part de recharge à domicile doit être comprise entre 0 et 100 %.')
    }
  }

  return warnings
}
