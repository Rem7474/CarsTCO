export interface LoaEstimateInput {
  purchasePrice: number
  firstPayment: number
  buybackValue: number
  annualInterestRatePct: number
  contractDurationMonths: number
}

/**
 * Estimates a LOA monthly payment from price, buyout value, rate and duration, using the
 * standard lease-payment formula (depreciation fee + finance fee), the same one used by
 * real leasing companies:
 *   - depreciation fee = (capitalized cost - residual value) / term
 *   - finance fee = (capitalized cost + residual value) * (APR / 2400)
 * "Capitalized cost" here is the purchase price net of the first payment.
 */
export function estimateLoaMonthlyPayment({
  purchasePrice,
  firstPayment,
  buybackValue,
  annualInterestRatePct,
  contractDurationMonths,
}: LoaEstimateInput): number {
  const n = Math.max(1, contractDurationMonths)
  const capitalizedCost = Math.max(0, purchasePrice - firstPayment)
  const residual = Math.max(0, buybackValue)

  const depreciationFee = (capitalizedCost - residual) / n
  const financeFee = (capitalizedCost + residual) * (annualInterestRatePct / 2400)

  return Math.max(0, depreciationFee + financeFee)
}
