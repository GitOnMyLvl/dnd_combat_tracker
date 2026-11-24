import { describe, it, expect, beforeEach } from 'vitest'
import { createBackup, restoreBackup } from './backup'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'

beforeEach(() => localStorage.clear())

describe('backup', () => {
  it('round-trips encounters and characters', () => {
    useEncounterStore.getState().renameEncounter('Dragon Lair')
    useCharacterStore.getState().saveCharacter({ name: 'Aria', type: 'ally', hp: 30 })
    const backup = JSON.parse(JSON.stringify(createBackup()))

    useEncounterStore.getState().renameEncounter('Something else')
    useCharacterStore.setState({ characters: [] })

    restoreBackup(backup)
    expect(useEncounterStore.getState().encounter.name).toBe('Dragon Lair')
    expect(useCharacterStore.getState().characters.map(c => c.name)).toEqual(['Aria'])
  })

  it('rejects files that are not backups', () => {
    expect(() => restoreBackup({ hello: 'world' })).toThrow('not a Battle Tracker backup')
    expect(() => restoreBackup(null)).toThrow()
  })
})
