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
})
