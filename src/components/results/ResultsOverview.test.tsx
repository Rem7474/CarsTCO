import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsOverview } from './ResultsOverview'
import { createDefaultScenario } from '../../data/defaults'
import { computeVehicleResult } from '../../lib/calculations'

describe('ResultsOverview', () => {
  it('exposes a vehicle result explanatory notes behind a disclosure, not hidden entirely', () => {
    const scenario = createDefaultScenario()
    const results = scenario.vehicles.map((v) => computeVehicleResult(v, scenario.holdingYears, scenario.annualMileageKm))
    render(<ResultsOverview vehicles={scenario.vehicles} results={results} />)

    // The default electric vehicle is LOA financing, which always pushes explanatory notes
    // (contract simulation, malus/bonus handling...) — those must not be silently dropped.
    const electricResult = results.find((r) => r.vehicleId === 'vehicleB')!
    expect(electricResult.notes.length).toBeGreaterThan(0)
    const disclosures = screen.getAllByText('Comment ce montant a été calculé')
    expect(disclosures.length).toBeGreaterThanOrEqual(1)
    const listItems = screen.getAllByRole('listitem').map((li) => li.textContent)
    for (const note of electricResult.notes) {
      // Not screen.getByText(note): Intl.NumberFormat('fr-FR') inserts narrow no-break
      // spaces around currency amounts that trip up dom-testing-library's text matcher.
      expect(listItems).toContain(note)
    }
  })
})
