import { describe, expect, it } from 'vitest'
import { estimateLoaMonthlyPayment } from './loaEstimate'

describe('estimateLoaMonthlyPayment', () => {
  it('combines depreciation and finance fee using the standard lease formula', () => {
    // capitalizedCost = 38000 - 3000 = 35000, residual = 16500
    // depreciation = (35000 - 16500) / 37 = 500
    // finance fee = (35000 + 16500) * (4 / 2400) = 85.8333...
    const monthly = estimateLoaMonthlyPayment({
      purchasePrice: 38000,
      firstPayment: 3000,
      buybackValue: 16500,
      annualInterestRatePct: 4,
      contractDurationMonths: 37,
    })

    expect(monthly).toBeCloseTo(500 + 85.8333, 3)
  })

  it('increases with the interest rate, all else equal', () => {
    const build = (rate: number) =>
      estimateLoaMonthlyPayment({
        purchasePrice: 30000,
        firstPayment: 2000,
        buybackValue: 12000,
        annualInterestRatePct: rate,
        contractDurationMonths: 36,
      })

    expect(build(6)).toBeGreaterThan(build(2))
  })

  it('never goes negative even with a residual value close to the capitalized cost', () => {
    const monthly = estimateLoaMonthlyPayment({
      purchasePrice: 20000,
      firstPayment: 0,
      buybackValue: 19900,
      annualInterestRatePct: 0,
      contractDurationMonths: 36,
    })
    expect(monthly).toBeGreaterThanOrEqual(0)
  })

  it('guards against a zero or negative contract duration instead of dividing by zero', () => {
    const monthly = estimateLoaMonthlyPayment({
      purchasePrice: 20000,
      firstPayment: 0,
      buybackValue: 10000,
      annualInterestRatePct: 4,
      contractDurationMonths: 0,
    })
    expect(Number.isFinite(monthly)).toBe(true)
  })
})
