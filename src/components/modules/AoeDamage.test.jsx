import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AoeDamage, { computeApplied } from './AoeDamage'
import { useEncounterStore } from '../../store/encounterStore'

describe('computeApplied', () => {
  it('returns 0 for invalid or non-positive amounts', () => {
    expect(computeApplied('', 'damage', false)).toBe(0)
    expect(computeApplied('abc', 'damage', false)).toBe(0)
    expect(computeApplied('0', 'damage', false)).toBe(0)
    expect(computeApplied('-5', 'damage', false)).toBe(0)
  })

  it('returns full amount for damage with no save', () => {
    expect(computeApplied('12', 'damage', false)).toBe(12)
  })

  it('halves and rounds down when save-for-half is on', () => {
    expect(computeApplied('10', 'damage', true)).toBe(5)
    expect(computeApplied('11', 'damage', true)).toBe(5)
    expect(computeApplied('1', 'damage', true)).toBe(0) // floor(1/2) = 0
    expect(computeApplied('7', 'damage', true)).toBe(3)
  })

  it('ignores save-for-half in heal mode', () => {
    expect(computeApplied('10', 'heal', true)).toBe(10)
    expect(computeApplied('7', 'heal', false)).toBe(7)
  })
})

describe('AoeDamage component', () => {
  beforeEach(() => {
    // Reset store to known state with 1 ally and 2 enemies
    useEncounterStore.setState({
      encounter: {
        id: 'test',
        name: 'Test',
        round: 1,
        currentTurnIndex: 0,
        initiativeOrder: [],
        combatants: [
          { id: 'a1', name: 'Ally One',  type: 'ally',  hp: { current: 30, max: 30, temp: 0 }, ac: 15, conditions: [], initiative: { bonus: 0, roll: 0 } },
          { id: 'e1', name: 'Goblin A',  type: 'enemy', hp: { current: 12, max: 12, temp: 0 }, ac: 13, conditions: [], initiative: { bonus: 0, roll: 0 } },
          { id: 'e2', name: 'Goblin B',  type: 'enemy', hp: { current: 12, max: 12, temp: 0 }, ac: 13, conditions: [], initiative: { bonus: 0, roll: 0 } },
        ],
      },
    })
  })

  it('renders combatant groups', () => {
    render(<AoeDamage />)
    expect(screen.getByText('Ally One')).toBeInTheDocument()
    expect(screen.getByText('Goblin A')).toBeInTheDocument()
    expect(screen.getByText('Goblin B')).toBeInTheDocument()
  })

  it('applies damage to selected combatants', async () => {
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('All Enemies'))
    await user.type(screen.getByLabelText('Amount'), '5')
    await user.click(screen.getByRole('button', { name: /^−5$/ }))

    const combatants = useEncounterStore.getState().encounter.combatants
    expect(combatants.find(c => c.id === 'e1').hp.current).toBe(7)
    expect(combatants.find(c => c.id === 'e2').hp.current).toBe(7)
    expect(combatants.find(c => c.id === 'a1').hp.current).toBe(30) // untouched
  })

  it('heals selected combatants (clamped to max)', async () => {
    useEncounterStore.getState().updateHP('a1', -20) // a1 now at 10/30
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('Heal'))
    await user.click(screen.getByText('All Allies'))
    await user.type(screen.getByLabelText('Amount'), '50')
    await user.click(screen.getByRole('button', { name: /^\+50$/ }))

    expect(useEncounterStore.getState().encounter.combatants.find(c => c.id === 'a1').hp.current).toBe(30)
  })

  it('halves damage when save-for-half is enabled', async () => {
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('All Enemies'))
    await user.click(screen.getByLabelText('Save for half'))
    await user.type(screen.getByLabelText('Amount'), '11')
    await user.click(screen.getByRole('button', { name: /^−5$/ }))

    const combatants = useEncounterStore.getState().encounter.combatants
    expect(combatants.find(c => c.id === 'e1').hp.current).toBe(7) // 12 - floor(11/2) = 7
  })

  it('clears selection after apply', async () => {
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('All Enemies'))
    await user.type(screen.getByLabelText('Amount'), '3')
    const btn = screen.getByRole('button', { name: /^−3$/ })
    await user.click(btn)

    // Apply button is now disabled since selection cleared
    expect(screen.getByRole('button', { name: /^−0$/ })).toBeDisabled()
  })
})
