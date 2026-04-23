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

  it('applies resist to quarter damage when combined with save', () => {
    expect(computeApplied('20', 'damage', false, true)).toBe(10)     // resist only
    expect(computeApplied('20', 'damage', true,  true)).toBe(5)      // save + resist → floor(floor(20/2)/2)
    expect(computeApplied('11', 'damage', true,  true)).toBe(2)      // floor(floor(11/2)/2) = floor(5/2) = 2
    expect(computeApplied('3',  'damage', true,  true)).toBe(0)
  })

  it('ignores resist in heal mode', () => {
    expect(computeApplied('10', 'heal', true, true)).toBe(10)
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

  it('halves damage per-combatant via SAVE toggle', async () => {
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('All Enemies'))
    // Only e1 saves
    await user.click(screen.getByLabelText('Saved: Goblin A'))
    await user.type(screen.getByLabelText('Amount'), '11')
    await user.click(screen.getByRole('button', { name: /^−11$/ }))

    const combatants = useEncounterStore.getState().encounter.combatants
    expect(combatants.find(c => c.id === 'e1').hp.current).toBe(7) // 12 - floor(11/2) = 7
    expect(combatants.find(c => c.id === 'e2').hp.current).toBe(1) // 12 - 11 = 1
  })

  it('SAVE + RES together deal 1/4 damage to that combatant', async () => {
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('All Enemies'))
    await user.click(screen.getByLabelText('Saved: Goblin A'))
    await user.click(screen.getByLabelText('Resist: Goblin A'))
    await user.click(screen.getByLabelText('Resist: Goblin B'))
    await user.type(screen.getByLabelText('Amount'), '20')
    await user.click(screen.getByRole('button', { name: /^−20$/ }))

    const combatants = useEncounterStore.getState().encounter.combatants
    // e1: save + resist → floor(floor(20/2)/2) = 5 → 12 - 5 = 7
    expect(combatants.find(c => c.id === 'e1').hp.current).toBe(7)
    // e2: resist only → floor(20/2) = 10 → 12 - 10 = 2
    expect(combatants.find(c => c.id === 'e2').hp.current).toBe(2)
  })

  it('deselecting a row clears its SAVE and RES state', async () => {
    render(<AoeDamage />)
    const user = userEvent.setup()

    await user.click(screen.getByText('All Enemies'))
    await user.click(screen.getByLabelText('Saved: Goblin A'))
    await user.click(screen.getByLabelText('Resist: Goblin A'))
    // Deselect Goblin A by clicking its row
    await user.click(screen.getByText('Goblin A'))
    // Re-select
    await user.click(screen.getByText('Goblin A'))
    await user.type(screen.getByLabelText('Amount'), '10')
    await user.click(screen.getByRole('button', { name: /^−10$/ }))

    // Goblin A should have taken full damage (SAVE/RES were cleared on deselect)
    expect(useEncounterStore.getState().encounter.combatants.find(c => c.id === 'e1').hp.current).toBe(2)
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
