import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthlyScheduleTable } from './MonthlyScheduleTable'
import { createDefaultScenario } from '../../data/defaults'

describe('MonthlyScheduleTable — compact view (default)', () => {
  it('renders a single shared table with one collapsed row per holding year, no months visible by default', () => {
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    expect(screen.getByRole('table', { name: /vue compacte/ })).toBeInTheDocument()
    for (let year = 1; year <= scenario.holdingYears; year++) {
      expect(screen.getByRole('button', { name: new RegExp(`Année ${year}$`) })).toBeInTheDocument()
    }
    expect(screen.queryByText('Mois 1')).not.toBeInTheDocument()
  })

  it('shows Financement/Récurrent/Ponctuel/Total column groups per vehicle', () => {
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    for (const vehicle of scenario.vehicles) {
      expect(screen.getByText(vehicle.label)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Financement')).toHaveLength(scenario.vehicles.length)
    expect(screen.getAllByText('Récurrent')).toHaveLength(scenario.vehicles.length)
    expect(screen.getAllByText('Ponctuel')).toHaveLength(scenario.vehicles.length)
  })

  it('expands a year to show its 12 shared month rows, and collapses it back on a second click', async () => {
    const user = userEvent.setup()
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    const yearButton = screen.getByRole('button', { name: /Année 1$/ })
    await user.click(yearButton)
    expect(screen.getAllByText(/^Mois \d+$/)).toHaveLength(12)

    await user.click(yearButton)
    expect(screen.queryByText('Mois 1')).not.toBeInTheDocument()
  })
})

describe('MonthlyScheduleTable — detailed view', () => {
  it('switches to one full table per vehicle, side by side, when toggled', async () => {
    const user = userEvent.setup()
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)

    await user.click(screen.getByRole('button', { name: 'Vue détaillée' }))

    expect(screen.getByRole('table', { name: /Citadine thermique/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /Citadine électrique/ })).toBeInTheDocument()
    // Each vehicle gets its own "Année 1" row again in this view.
    expect(screen.getAllByRole('button', { name: /Année 1$/ })).toHaveLength(scenario.vehicles.length)
  })

  it('expands a year across all vehicles at once in detailed view too', async () => {
    const user = userEvent.setup()
    const scenario = createDefaultScenario()
    render(<MonthlyScheduleTable scenario={scenario} />)
    await user.click(screen.getByRole('button', { name: 'Vue détaillée' }))

    const [yearButton] = screen.getAllByRole('button', { name: /Année 1$/ })
    await user.click(yearButton)
    expect(screen.getAllByText(/^Mois \d+$/)).toHaveLength(12 * scenario.vehicles.length)
  })
})
