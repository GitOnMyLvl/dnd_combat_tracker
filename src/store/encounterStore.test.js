import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEncounterStore, mapApiToCombatant } from './encounterStore'

// Reset store before each test
beforeEach(() => {
  useEncounterStore.setState({
    encounter: {
      id: 'test-enc',
      name: 'New Encounter',
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      initiativeOrder: [],
    },
    savedEncounters: [],
    selectedCombatantId: null,
  })
})

// Helper to get current state
const state = () => useEncounterStore.getState()
const encounter = () => state().encounter

describe('encounterStore', () => {
  // ─── Encounter Management ───

  describe('encounter management', () => {
    it('starts with a default encounter', () => {
      expect(encounter().name).toBe('New Encounter')
      expect(encounter().round).toBe(1)
      expect(encounter().combatants).toEqual([])
    })

    it('renames the encounter', () => {
      state().renameEncounter('Goblin Ambush')
      expect(encounter().name).toBe('Goblin Ambush')
    })

    it('saves and loads encounters', () => {
      state().renameEncounter('Battle 1')
      state().saveEncounter()
      expect(state().savedEncounters).toHaveLength(1)
      expect(state().savedEncounters[0].name).toBe('Battle 1')

      // Modify current encounter
      state().renameEncounter('Battle 2')
      expect(encounter().name).toBe('Battle 2')

      // Load saved
      state().loadEncounter(state().savedEncounters[0].id)
      expect(encounter().name).toBe('Battle 1')
    })

    it('overwrites when saving an encounter with the same id', () => {
      state().saveEncounter()
      state().renameEncounter('Updated')
      state().saveEncounter()
      expect(state().savedEncounters).toHaveLength(1)
      expect(state().savedEncounters[0].name).toBe('Updated')
    })

    it('deletes saved encounters', () => {
      state().saveEncounter()
      const id = state().savedEncounters[0].id
      state().deleteEncounter(id)
      expect(state().savedEncounters).toHaveLength(0)
    })

    it('creates a new encounter', () => {
      state().addCombatant({ name: 'Goblin' })
      expect(encounter().combatants).toHaveLength(1)

      state().newEncounter()
      expect(encounter().combatants).toHaveLength(0)
      expect(encounter().name).toBe('New Encounter')
    })
  })

  // ─── Combatant CRUD ───

  describe('combatant CRUD', () => {
    it('adds a combatant with defaults', () => {
      const id = state().addCombatant()
      expect(encounter().combatants).toHaveLength(1)
      const c = encounter().combatants[0]
      expect(c.id).toBe(id)
      expect(c.name).toBe('Unknown')
      expect(c.type).toBe('enemy')
      expect(c.hp).toEqual({ current: 10, max: 10, temp: 0 })
      expect(c.ac).toBe(10)
    })

    it('adds a combatant with overrides', () => {
      state().addCombatant({ name: 'Troll', hp: { current: 84, max: 84, temp: 0 }, ac: 15 })
      const c = encounter().combatants[0]
      expect(c.name).toBe('Troll')
      expect(c.hp.max).toBe(84)
      expect(c.ac).toBe(15)
    })

    it('removes a combatant', () => {
      const id = state().addCombatant({ name: 'Goblin' })
      expect(encounter().combatants).toHaveLength(1)
      state().removeCombatant(id)
      expect(encounter().combatants).toHaveLength(0)
    })

    it('removes combatant from initiative order when removed', () => {
      const id = state().addCombatant({ name: 'Goblin' })
      useEncounterStore.setState(s => ({
        encounter: { ...s.encounter, initiativeOrder: [id] },
      }))
      state().removeCombatant(id)
      expect(encounter().initiativeOrder).toEqual([])
    })

    it('updates a combatant', () => {
      const id = state().addCombatant({ name: 'Goblin' })
      state().updateCombatant(id, { name: 'Hobgoblin', ac: 18 })
      const c = encounter().combatants[0]
      expect(c.name).toBe('Hobgoblin')
      expect(c.ac).toBe(18)
    })
  })

  // ─── HP Management ───

  describe('HP management', () => {
    let id

    beforeEach(() => {
      id = state().addCombatant({ name: 'Fighter', hp: { current: 50, max: 50, temp: 0 } })
    })

    it('applies damage via updateHP', () => {
      state().updateHP(id, -15)
      expect(encounter().combatants[0].hp.current).toBe(35)
    })

    it('applies healing via updateHP', () => {
      state().updateHP(id, -30)
      state().updateHP(id, 10)
      expect(encounter().combatants[0].hp.current).toBe(30)
    })

    it('clamps HP at 0 (no negative)', () => {
      state().updateHP(id, -999)
      expect(encounter().combatants[0].hp.current).toBe(0)
    })

    it('clamps HP at max (no overheal)', () => {
      state().updateHP(id, 100)
      expect(encounter().combatants[0].hp.current).toBe(50)
    })

    it('sets HP directly via setHP', () => {
      state().setHP(id, 25)
      expect(encounter().combatants[0].hp.current).toBe(25)
    })

    it('clamps setHP within 0..max', () => {
      state().setHP(id, -5)
      expect(encounter().combatants[0].hp.current).toBe(0)
      state().setHP(id, 999)
      expect(encounter().combatants[0].hp.current).toBe(50)
    })
  })

  // ─── Conditions ───

  describe('conditions', () => {
    let id

    beforeEach(() => {
      id = state().addCombatant({ name: 'Rogue' })
    })

    it('toggles a condition on', () => {
      state().toggleCondition(id, 'Poisoned')
      expect(encounter().combatants[0].conditions).toContain('Poisoned')
    })

    it('toggles a condition off', () => {
      state().toggleCondition(id, 'Poisoned')
      state().toggleCondition(id, 'Poisoned')
      expect(encounter().combatants[0].conditions).not.toContain('Poisoned')
    })

    it('handles multiple conditions independently', () => {
      state().toggleCondition(id, 'Poisoned')
      state().toggleCondition(id, 'Blinded')
      expect(encounter().combatants[0].conditions).toEqual(['Poisoned', 'Blinded'])
      state().toggleCondition(id, 'Poisoned')
      expect(encounter().combatants[0].conditions).toEqual(['Blinded'])
    })
  })

  // ─── Exhaustion ───

  describe('exhaustion', () => {
    let id

    beforeEach(() => {
      id = state().addCombatant({ name: 'Barbarian' })
    })

    it('sets exhaustion level', () => {
      state().setExhaustion(id, 3)
      expect(encounter().combatants[0].exhaustion).toBe(3)
    })

    it('clamps exhaustion between 0 and 10', () => {
      state().setExhaustion(id, -5)
      expect(encounter().combatants[0].exhaustion).toBe(0)
      state().setExhaustion(id, 15)
      expect(encounter().combatants[0].exhaustion).toBe(10)
    })
  })

  // ─── Inspiration ───

  describe('inspiration', () => {
    it('toggles inspiration', () => {
      const id = state().addCombatant({ name: 'Bard' })
      expect(encounter().combatants[0].inspiration).toBe(false)
      state().toggleInspiration(id)
      expect(encounter().combatants[0].inspiration).toBe(true)
      state().toggleInspiration(id)
      expect(encounter().combatants[0].inspiration).toBe(false)
    })
  })

  // ─── Initiative ───

  describe('initiative', () => {
    it('sets initiative roll for a combatant', () => {
      const id = state().addCombatant({ name: 'Wizard', initiative: { bonus: 2, roll: 0 } })
      state().setInitiativeRoll(id, 15)
      expect(encounter().combatants[0].initiative.roll).toBe(15)
    })

    it('sorts initiative by total (roll + bonus), descending', () => {
      const a = state().addCombatant({ name: 'Slow', initiative: { bonus: 0, roll: 5 } })
      const b = state().addCombatant({ name: 'Fast', initiative: { bonus: 3, roll: 15 } })
      const c = state().addCombatant({ name: 'Mid', initiative: { bonus: 1, roll: 10 } })

      state().sortInitiative()
      expect(encounter().initiativeOrder).toEqual([b, c, a])
    })

    it('breaks ties by DEX score (2024 rule)', () => {
      const a = state().addCombatant({
        name: 'LowDex',
        initiative: { bonus: 2, roll: 10 },
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      })
      const b = state().addCombatant({
        name: 'HighDex',
        initiative: { bonus: 2, roll: 10 },
        abilities: { str: 10, dex: 18, con: 10, int: 10, wis: 10, cha: 10 },
      })

      state().sortInitiative()
      expect(encounter().initiativeOrder).toEqual([b, a])
    })

    it('resets round and turn index on sort', () => {
      state().addCombatant({ name: 'A', initiative: { bonus: 0, roll: 10 } })
      // Advance the round
      useEncounterStore.setState(s => ({
        encounter: { ...s.encounter, round: 5, currentTurnIndex: 3 },
      }))
      state().sortInitiative()
      expect(encounter().round).toBe(1)
      expect(encounter().currentTurnIndex).toBe(0)
    })

    it('adds combatant to initiative in correct position', () => {
      const a = state().addCombatant({ name: 'A', initiative: { bonus: 0, roll: 20 } })
      const b = state().addCombatant({ name: 'B', initiative: { bonus: 0, roll: 5 } })
      state().sortInitiative()

      const c = state().addCombatant({ name: 'C', initiative: { bonus: 0, roll: 10 } })
      state().addToInitiative(c)
      expect(encounter().initiativeOrder).toEqual([a, c, b])
    })

    it('does not add duplicate to initiative', () => {
      const id = state().addCombatant({ name: 'A', initiative: { bonus: 0, roll: 10 } })
      state().sortInitiative()
      state().addToInitiative(id)
      expect(encounter().initiativeOrder).toHaveLength(1)
    })

    it('reorders initiative manually', () => {
      const a = state().addCombatant({ name: 'A' })
      const b = state().addCombatant({ name: 'B' })
      state().reorderInitiative([b, a])
      expect(encounter().initiativeOrder).toEqual([b, a])
    })
  })

  // ─── Turn Tracking ───

  describe('turn tracking', () => {
    let ids

    beforeEach(() => {
      ids = [
        state().addCombatant({ name: 'A', initiative: { bonus: 0, roll: 20 } }),
        state().addCombatant({ name: 'B', initiative: { bonus: 0, roll: 15 } }),
        state().addCombatant({ name: 'C', initiative: { bonus: 0, roll: 10 } }),
      ]
      state().sortInitiative()
    })

    it('advances to next turn', () => {
      expect(encounter().currentTurnIndex).toBe(0)
      state().nextTurn()
      expect(encounter().currentTurnIndex).toBe(1)
      expect(encounter().round).toBe(1)
    })

    it('wraps around and increments round', () => {
      state().nextTurn() // index 1
      state().nextTurn() // index 2
      state().nextTurn() // wraps to 0, round 2
      expect(encounter().currentTurnIndex).toBe(0)
      expect(encounter().round).toBe(2)
    })

    it('goes to previous turn', () => {
      state().nextTurn() // index 1
      state().prevTurn() // index 0
      expect(encounter().currentTurnIndex).toBe(0)
      expect(encounter().round).toBe(1)
    })

    it('wraps backward and decrements round', () => {
      state().nextTurn() // index 1
      state().nextTurn() // index 2
      state().nextTurn() // round 2, index 0
      state().prevTurn() // round 1, index 2
      expect(encounter().currentTurnIndex).toBe(2)
      expect(encounter().round).toBe(1)
    })

    it('does not go below round 1', () => {
      state().prevTurn() // wraps to last, round stays 1
      expect(encounter().round).toBe(1)
    })

    it('handles empty initiative order', () => {
      useEncounterStore.setState(s => ({
        encounter: { ...s.encounter, initiativeOrder: [] },
      }))
      state().nextTurn()
      state().prevTurn()
      // Should not crash, state unchanged
      expect(encounter().currentTurnIndex).toBe(0)
    })
  })

  // ─── Selected Combatant ───

  describe('selected combatant', () => {
    it('selects a combatant', () => {
      const id = state().addCombatant({ name: 'Target' })
      state().selectCombatant(id)
      expect(state().selectedCombatantId).toBe(id)
    })
  })

  // ─── API Mapping ───

  describe('mapApiToCombatant', () => {
    it('maps Open5e data to combatant shape', () => {
      const apiData = {
        name: 'Goblin',
        hit_points: 7,
        armor_class: 15,
        dexterity: 14,
        strength: 8,
        constitution: 10,
        intelligence: 10,
        wisdom: 8,
        charisma: 8,
        spell_save_dc: null,
        spell_attack_bonus: null,
        legendary_actions: null,
      }

      const result = mapApiToCombatant(apiData)
      expect(result.name).toBe('Goblin')
      expect(result.hp).toEqual({ current: 7, max: 7, temp: 0 })
      expect(result.ac).toBe(15)
      expect(result.initiative.bonus).toBe(2) // floor((14-10)/2)
      expect(result.abilities.dex).toBe(14)
      expect(result.legendary).toBeNull()
    })

    it('maps legendary actions', () => {
      const result = mapApiToCombatant({
        name: 'Dragon',
        legendary_actions: [{ name: 'Detect' }, { name: 'Tail Attack' }, { name: 'Wing Attack' }],
      })
      expect(result.legendary).toEqual({ total: 3, remaining: 3 })
    })

    it('handles missing fields gracefully', () => {
      const result = mapApiToCombatant({})
      expect(result.name).toBe('Unknown')
      expect(result.hp).toEqual({ current: 10, max: 10, temp: 0 })
      expect(result.ac).toBe(10)
    })
  })

  // ─── Reset to API ───

  describe('resetCombatantToApi', () => {
    it('resets a modified combatant back to API defaults', () => {
      const apiData = {
        name: 'Goblin',
        hit_points: 7,
        armor_class: 15,
        dexterity: 14,
        strength: 8,
        constitution: 10,
        intelligence: 10,
        wisdom: 8,
        charisma: 8,
      }

      const id = state().addCombatant({
        ...mapApiToCombatant(apiData),
        type: 'enemy',
        _source: 'api',
        _apiData: apiData,
      })

      // Modify the combatant
      state().updateCombatant(id, { name: 'Modified Goblin', ac: 99 })
      expect(encounter().combatants[0].name).toBe('Modified Goblin')

      // Reset
      state().resetCombatantToApi(id)
      expect(encounter().combatants[0].name).toBe('Goblin')
      expect(encounter().combatants[0].ac).toBe(15)
      expect(encounter().combatants[0].id).toBe(id) // same id
    })

    it('does nothing for manual combatants', () => {
      const id = state().addCombatant({ name: 'Manual', _source: 'manual' })
      state().resetCombatantToApi(id)
      expect(encounter().combatants[0].name).toBe('Manual')
    })
  })

  // ─── Death Saves ───

  describe('death saves', () => {
    it('sets death save successes', () => {
      const id = state().addCombatant({ name: 'Downed' })
      state().setDeathSave(id, 'successes', 2)
      expect(encounter().combatants[0].deathSaves.successes).toBe(2)
    })

    it('sets death save failures', () => {
      const id = state().addCombatant({ name: 'Downed' })
      state().setDeathSave(id, 'failures', 3)
      expect(encounter().combatants[0].deathSaves.failures).toBe(3)
    })

    it('clamps death saves between 0 and 3', () => {
      const id = state().addCombatant({ name: 'Downed' })
      state().setDeathSave(id, 'successes', 5)
      expect(encounter().combatants[0].deathSaves.successes).toBe(3)
      state().setDeathSave(id, 'failures', -1)
      expect(encounter().combatants[0].deathSaves.failures).toBe(0)
    })

    it('resets death saves', () => {
      const id = state().addCombatant({ name: 'Downed' })
      state().setDeathSave(id, 'successes', 2)
      state().setDeathSave(id, 'failures', 1)
      state().resetDeathSaves(id)
      expect(encounter().combatants[0].deathSaves).toEqual({ successes: 0, failures: 0 })
    })
  })

  // ─── Remove from Initiative ───

  describe('removeFromInitiative', () => {
    it('removes combatant from initiative order', () => {
      const id1 = state().addCombatant({ name: 'A' })
      const id2 = state().addCombatant({ name: 'B' })
      state().sortInitiative()
      expect(encounter().initiativeOrder).toContain(id1)

      state().removeFromInitiative(id1)
      expect(encounter().initiativeOrder).not.toContain(id1)
      expect(encounter().initiativeOrder).toContain(id2)
      // Combatant still exists in combatants list
      expect(encounter().combatants.find(c => c.id === id1)).toBeTruthy()
    })

    it('clamps currentTurnIndex when removing', () => {
      const id1 = state().addCombatant({ name: 'A' })
      const id2 = state().addCombatant({ name: 'B' })
      state().sortInitiative()
      state().nextTurn() // index = 1
      state().removeFromInitiative(id1) // now only 1 in order
      expect(encounter().currentTurnIndex).toBeLessThanOrEqual(encounter().initiativeOrder.length - 1)
    })
  })
})
