import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthlyScheduleTable } from './MonthlyScheduleTable'
import { createDefaultScenario } from '../../data/defaults'

describe('MonthlyScheduleTable', () => {
  it('renders one collapsed row per holding year per vehicle, with no month rows visible by default', () => {
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    for (let year = 1; year <= scenario.holdingYears; year++) {
      expect(screen.getAllByRole('button', { name: new RegExp(`Année ${year}$`) })).toHaveLength(
        scenario.vehicles.length,
      )
    }
    expect(screen.queryByText('Mois 1')).not.toBeInTheDocument()
  })

  it('expands a year across all vehicles at once, and collapses it back on a second click', async () => {
    const user = userEvent.setup()
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    const [yearButton] = screen.getAllByRole('button', { name: /Année 1$/ })
    await user.click(yearButton)
    expect(screen.getAllByText(/^Mois \d+$/)).toHaveLength(12 * scenario.vehicles.length)

    await user.click(yearButton)
    expect(screen.queryByText('Mois 1')).not.toBeInTheDocument()
  })

  it('renders every vehicle in its own table, side by side, for comparison', () => {
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    expect(screen.getByRole('table', { name: /Citadine thermique/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /Citadine électrique/ })).toBeInTheDocument()
  })
})
