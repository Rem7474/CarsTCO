import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('App', () => {
  it('renders the header, both default vehicles and the results section', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'CarsTCO' })).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('Citadine thermique')).toHaveLength(1)
    expect(screen.getAllByDisplayValue('Citadine électrique')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Résultats' })).toBeInTheDocument()
    expect(screen.getByText('Coût total')).toBeInTheDocument()
  })

  it('updates the vehicle label live as the user types', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByDisplayValue('Citadine thermique')
    await user.clear(input)
    await user.type(input, 'Ma citadine')

    expect(screen.getByDisplayValue('Ma citadine')).toBeInTheDocument()
    const summaryTable = screen.getByRole('table')
    expect(within(summaryTable).getByText('Ma citadine')).toBeInTheDocument()
  })

  it('recomputes the total cost when the annual mileage changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const table = screen.getByRole('table')
    const totalRowBefore = within(table).getByText('Coût total').closest('tr')!
    const totalBefore = within(totalRowBefore).getAllByRole('cell')[1].textContent

    const mileageInput = screen.getByLabelText(/Kilométrage annuel parcouru/)
    await user.clear(mileageInput)
    await user.type(mileageInput, '30000')

    const totalRowAfter = within(screen.getByRole('table')).getByText('Coût total').closest('tr')!
    const totalAfter = within(totalRowAfter).getAllByRole('cell')[1].textContent

    expect(totalAfter).not.toEqual(totalBefore)
  })

  it('supports adding and removing vehicles beyond the default two', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Ajouter un véhicule/ }))

    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4) // Poste + 3 vehicles

    const removeButtons = screen.getAllByRole('button', { name: /Retirer ce véhicule/ })
    expect(removeButtons).toHaveLength(3)
    await user.click(removeButtons[0])

    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(3) // back to 2 vehicles
  })
})
