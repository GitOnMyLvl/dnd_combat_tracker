import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterStore, combatantToTemplate, templateToCombatant, DEFAULT_ABILITIES } from './characterStore'

beforeEach(() => {
  useCharacterStore.setState({
    characters: [],
    parties: [],
  })
})

const state = () => useCharacterStore.getState()

describe('characterStore', () => {
  // ─── Characters ───

  describe('characters', () => {
    it('saves a character', () => {
      const id = state().saveCharacter({ name: 'Gandalf', type: 'ally', hp: 80, ac: 15, initiativeBonus: 2 })
      expect(state().characters).toHaveLength(1)
      expect(state().characters[0].id).toBe(id)
      expect(state().characters[0].name).toBe('Gandalf')
    })

    it('updates a character', () => {
      const id = state().saveCharacter({ name: 'Gandalf', type: 'ally', hp: 80, ac: 15 })
      state().updateCharacter(id, { name: 'Gandalf the White', hp: 120 })
      expect(state().characters[0].name).toBe('Gandalf the White')
      expect(state().characters[0].hp).toBe(120)
    })

    it('removes a character', () => {
      const id = state().saveCharacter({ name: 'Gandalf', type: 'ally', hp: 80, ac: 15 })
      state().removeCharacter(id)
      expect(state().characters).toHaveLength(0)
    })

    it('removes character from parties when character is deleted', () => {
      const charId = state().saveCharacter({ name: 'Gandalf', type: 'ally', hp: 80, ac: 15 })
      state().saveParty('Fellowship', [charId])
      expect(state().parties[0].characterIds).toContain(charId)

      state().removeCharacter(charId)
      expect(state().parties[0].characterIds).not.toContain(charId)
    })
  })

  // ─── Parties ───

  describe('parties', () => {
    it('saves a party', () => {
      const id = state().saveParty('Heroes', ['char-1', 'char-2'])
      expect(state().parties).toHaveLength(1)
      expect(state().parties[0].id).toBe(id)
      expect(state().parties[0].name).toBe('Heroes')
      expect(state().parties[0].characterIds).toEqual(['char-1', 'char-2'])
    })

    it('updates a party', () => {
      const id = state().saveParty('Heroes', [])
      state().updateParty(id, { name: 'Super Heroes' })
      expect(state().parties[0].name).toBe('Super Heroes')
    })

    it('removes a party', () => {
      const id = state().saveParty('Heroes', [])
      state().removeParty(id)
      expect(state().parties).toHaveLength(0)
    })

    it('adds a character to a party', () => {
      const partyId = state().saveParty('Heroes', [])
      state().addCharacterToParty(partyId, 'char-1')
      expect(state().parties[0].characterIds).toEqual(['char-1'])
    })

    it('does not add duplicate character to party', () => {
      const partyId = state().saveParty('Heroes', ['char-1'])
      state().addCharacterToParty(partyId, 'char-1')
      expect(state().parties[0].characterIds).toEqual(['char-1'])
    })

    it('removes a character from a party', () => {
      const partyId = state().saveParty('Heroes', ['char-1', 'char-2'])
      state().removeCharacterFromParty(partyId, 'char-1')
      expect(state().parties[0].characterIds).toEqual(['char-2'])
    })
  })
})

// ─── Template Conversion ───

describe('combatantToTemplate', () => {
  it('extracts template fields from combatant', () => {
    const combatant = {
      id: 'c1',
      name: 'Fighter',
      type: 'ally',
      hp: { current: 30, max: 50, temp: 5 },
      ac: 18,
      initiative: { bonus: 3, roll: 15 },
      spellSaveDC: null,
      spellAttackBonus: null,
      legendary: null,
      conditions: ['Poisoned'],
      notes: 'Tank',
      abilities: { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
      exhaustion: 2,
      inspiration: true,
      _source: 'manual',
      _apiData: null,
    }

    const template = combatantToTemplate(combatant)
    expect(template.name).toBe('Fighter')
    expect(template.type).toBe('ally')
    expect(template.hp).toBe(50) // max HP, not current
    expect(template.ac).toBe(18)
    expect(template.initiativeBonus).toBe(3)
    expect(template.notes).toBe('Tank')
    expect(template.abilities.str).toBe(18)
    // Should not include runtime data
    expect(template).not.toHaveProperty('id')
    expect(template).not.toHaveProperty('conditions')
    expect(template).not.toHaveProperty('exhaustion')
    expect(template).not.toHaveProperty('_source')
  })

  it('uses default abilities when combatant has none', () => {
    const template = combatantToTemplate({
      name: 'X', type: 'enemy', hp: { max: 10 }, ac: 10,
      initiative: { bonus: 0 }, abilities: null, notes: '',
    })
    expect(template.abilities).toEqual(DEFAULT_ABILITIES)
  })
})

describe('templateToCombatant', () => {
  it('converts template to combatant-compatible shape', () => {
    const template = {
      name: 'Cleric',
      type: 'ally',
      hp: 40,
      ac: 16,
      initiativeBonus: 1,
      spellSaveDC: 15,
      spellAttackBonus: 7,
      legendary: null,
      notes: 'Healer',
      abilities: { str: 14, dex: 12, con: 14, int: 10, wis: 18, cha: 12 },
    }

    const combatant = templateToCombatant(template)
    expect(combatant.name).toBe('Cleric')
    expect(combatant.hp).toEqual({ current: 40, max: 40, temp: 0 })
    expect(combatant.initiative).toEqual({ bonus: 1, roll: 0 })
    expect(combatant.spellSaveDC).toBe(15)
    expect(combatant.abilities.wis).toBe(18)
    expect(combatant.notes).toBe('Healer')
  })

  it('uses default abilities when template has none', () => {
    const combatant = templateToCombatant({
      name: 'X', type: 'enemy', hp: 10, ac: 10,
      initiativeBonus: 0, abilities: null, notes: '',
    })
    expect(combatant.abilities).toEqual(DEFAULT_ABILITIES)
  })
})
