import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthlyScheduleTable } from './MonthlyScheduleTable'
import { createDefaultScenario } from '../../data/defaults'

describe('MonthlyScheduleTable', () => {
  it('renders one collapsed row per holding year, with no month rows visible by default', () => {
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    for (let year = 1; year <= scenario.holdingYears; year++) {
      expect(screen.getByRole('button', { name: new RegExp(`Année ${year}$`) })).toBeInTheDocument()
    }
    expect(screen.queryByText('Mois 1')).not.toBeInTheDocument()
  })

  it('expands a year to show its 12 months, and collapses it back on a second click', async () => {
    const user = userEvent.setup()
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    const yearButton = screen.getByRole('button', { name: /Année 1$/ })
    await user.click(yearButton)
    expect(screen.getAllByText(/^Mois \d+$/)).toHaveLength(12)

    await user.click(yearButton)
    expect(screen.queryByText('Mois 1')).not.toBeInTheDocument()
  })

  it('switches the detailed vehicle when a different pill is selected', async () => {
    const user = userEvent.setup()
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    expect(screen.getByRole('table', { name: /Citadine thermique/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Citadine électrique', pressed: false }))

    expect(screen.getByRole('table', { name: /Citadine électrique/ })).toBeInTheDocument()
  })
})
