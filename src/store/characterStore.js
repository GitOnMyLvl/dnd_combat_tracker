import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

/**
 * Extracts saveable character template fields from a combatant.
 * Strips runtime-only data (id, conditions, initiative roll, _source, _apiData).
 */
const DEFAULT_ABILITIES = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }

export function combatantToTemplate(combatant) {
  return {
    name: combatant.name,
    type: combatant.type,
    hp: combatant.hp.max,
    ac: combatant.ac,
    initiativeBonus: combatant.initiative.bonus,
    spellSaveDC: combatant.spellSaveDC,
    spellAttackBonus: combatant.spellAttackBonus,
    legendary: combatant.legendary,
    notes: combatant.notes ?? '',
    abilities: combatant.abilities ? { ...combatant.abilities } : { ...DEFAULT_ABILITIES },
  }
}

export { DEFAULT_ABILITIES }

/**
 * Converts a saved character template into addCombatant-compatible data.
 */
export function templateToCombatant(template) {
  return {
    name: template.name,
    type: template.type,
    hp: { current: template.hp, max: template.hp, temp: 0 },
    ac: template.ac,
    initiative: { bonus: template.initiativeBonus, roll: 0 },
    spellSaveDC: template.spellSaveDC,
    spellAttackBonus: template.spellAttackBonus,
    legendary: template.legendary,
    abilities: template.abilities ? { ...template.abilities } : { ...DEFAULT_ABILITIES },
    notes: template.notes ?? '',
  }
}

export const useCharacterStore = create(
  persist(
    (set, get) => ({
      characters: [],
      parties: [],

      // ─── Characters ───
      saveCharacter: (template) => {
        const char = { id: uuid(), ...template }
        set(s => ({ characters: [...s.characters, char] }))
        return char.id
      },

      updateCharacter: (id, changes) => {
        set(s => ({
          characters: s.characters.map(c => c.id === id ? { ...c, ...changes } : c),
        }))
      },

      removeCharacter: (id) => {
        set(s => ({
          characters: s.characters.filter(c => c.id !== id),
          // Also remove from any parties
          parties: s.parties.map(p => ({
            ...p,
            characterIds: p.characterIds.filter(cid => cid !== id),
          })),
        }))
      },

      // ─── Parties ───
      saveParty: (name, characterIds) => {
        const party = { id: uuid(), name, characterIds }
        set(s => ({ parties: [...s.parties, party] }))
        return party.id
      },

      updateParty: (id, changes) => {
        set(s => ({
          parties: s.parties.map(p => p.id === id ? { ...p, ...changes } : p),
        }))
      },

      removeParty: (id) => {
        set(s => ({ parties: s.parties.filter(p => p.id !== id) }))
      },

      addCharacterToParty: (partyId, characterId) => {
        set(s => ({
          parties: s.parties.map(p => {
            if (p.id !== partyId) return p
            if (p.characterIds.includes(characterId)) return p
            return { ...p, characterIds: [...p.characterIds, characterId] }
          }),
        }))
      },

      removeCharacterFromParty: (partyId, characterId) => {
        set(s => ({
          parties: s.parties.map(p =>
            p.id === partyId
              ? { ...p, characterIds: p.characterIds.filter(id => id !== characterId) }
              : p
          ),
        }))
      },
    }),
    { name: 'dnd-tracker-characters' }
  )
)
