import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

const defaultEncounter = () => ({
  id: uuid(),
  name: 'New Encounter',
  round: 1,
  currentTurnIndex: 0,
  combatants: [],
  initiativeOrder: [], // array of combatant ids, sorted
  initiativeMode: 'auto', // 'auto' | 'manual'
})

const makeCombatant = (overrides = {}) => ({
  id: uuid(),
  name: 'Unknown',
  type: 'enemy', // 'ally' | 'enemy'
  hp: { current: 10, max: 10, temp: 0 },
  ac: 10,
  initiative: { bonus: 0, roll: 0 },
  spellSaveDC: null,
  spellAttackBonus: null,
  conditions: [],
  concentration: null,
  legendary: null,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  notes: '',
  exhaustion: 0,
  inspiration: false,
  _source: 'manual',
  _apiData: null,
  ...overrides,
})

export const useEncounterStore = create(
  persist(
    (set, get) => ({
      encounter: defaultEncounter(),
      savedEncounters: [],

      // Encounter management
      newEncounter: () => set({ encounter: defaultEncounter() }),

      saveEncounter: () => {
        const { encounter, savedEncounters } = get()
        const existing = savedEncounters.findIndex(e => e.id === encounter.id)
        if (existing >= 0) {
          const updated = [...savedEncounters]
          updated[existing] = { ...encounter }
          set({ savedEncounters: updated })
        } else {
          set({ savedEncounters: [...savedEncounters, { ...encounter }] })
        }
      },

      loadEncounter: (id) => {
        const { savedEncounters } = get()
        const enc = savedEncounters.find(e => e.id === id)
        if (enc) set({ encounter: { ...enc } })
      },

      deleteEncounter: (id) => {
        set(s => ({ savedEncounters: s.savedEncounters.filter(e => e.id !== id) }))
      },

      renameEncounter: (name) => {
        set(s => ({ encounter: { ...s.encounter, name } }))
      },

      // Combatants
      addCombatant: (data = {}) => {
        const c = makeCombatant(data)
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: [...s.encounter.combatants, c],
          }
        }))
        return c.id
      },

      removeCombatant: (id) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.filter(c => c.id !== id),
            initiativeOrder: s.encounter.initiativeOrder.filter(i => i !== id),
          }
        }))
      },

      updateCombatant: (id, changes) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c =>
              c.id === id ? { ...c, ...changes } : c
            ),
          }
        }))
      },

      updateHP: (id, delta) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c => {
              if (c.id !== id) return c
              const current = Math.max(0, Math.min(c.hp.max, c.hp.current + delta))
              return { ...c, hp: { ...c.hp, current } }
            }),
          }
        }))
      },

      setHP: (id, value) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c => {
              if (c.id !== id) return c
              const current = Math.max(0, Math.min(c.hp.max, value))
              return { ...c, hp: { ...c.hp, current } }
            }),
          }
        }))
      },

      toggleCondition: (id, condition) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c => {
              if (c.id !== id) return c
              const has = c.conditions.includes(condition)
              return {
                ...c,
                conditions: has
                  ? c.conditions.filter(x => x !== condition)
                  : [...c.conditions, condition],
              }
            }),
          }
        }))
      },

      resetCombatantToApi: (id) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c => {
              if (c.id !== id || !c._apiData) return c
              return makeCombatant({
                id: c.id,
                type: c.type,
                _source: 'api',
                _apiData: c._apiData,
                ...mapApiToCombatant(c._apiData),
              })
            }),
          }
        }))
      },

      // Initiative
      setInitiativeMode: (mode) => {
        set(s => ({ encounter: { ...s.encounter, initiativeMode: mode } }))
      },

      setInitiativeRoll: (id, roll) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c =>
              c.id === id ? { ...c, initiative: { ...c.initiative, roll } } : c
            ),
          }
        }))
      },

      setExhaustion: (id, level) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c =>
              c.id === id ? { ...c, exhaustion: Math.max(0, Math.min(10, level)) } : c
            ),
          }
        }))
      },

      toggleInspiration: (id) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: s.encounter.combatants.map(c =>
              c.id === id ? { ...c, inspiration: !c.inspiration } : c
            ),
          }
        }))
      },

      sortInitiative: () => {
        set(s => {
          const isManual = s.encounter.initiativeMode === 'manual'
          const sorted = [...s.encounter.combatants]
            .sort((a, b) => {
              const aTotal = isManual ? a.initiative.roll : a.initiative.roll + a.initiative.bonus
              const bTotal = isManual ? b.initiative.roll : b.initiative.roll + b.initiative.bonus
              if (bTotal !== aTotal) return bTotal - aTotal
              return (b.abilities?.dex ?? 10) - (a.abilities?.dex ?? 10)
            })
            .map(c => c.id)
          return {
            encounter: {
              ...s.encounter,
              initiativeOrder: sorted,
              currentTurnIndex: 0,
              round: 1,
            }
          }
        })
      },

      nextTurn: () => {
        set(s => {
          const len = s.encounter.initiativeOrder.length
          if (len === 0) return s
          const next = s.encounter.currentTurnIndex + 1
          const newIndex = next % len
          const newRound = next >= len ? s.encounter.round + 1 : s.encounter.round
          return {
            encounter: {
              ...s.encounter,
              currentTurnIndex: newIndex,
              round: newRound,
            }
          }
        })
      },

      prevTurn: () => {
        set(s => {
          const len = s.encounter.initiativeOrder.length
          if (len === 0) return s
          const prev = s.encounter.currentTurnIndex - 1
          const newIndex = prev < 0 ? len - 1 : prev
          const newRound = prev < 0
            ? Math.max(1, s.encounter.round - 1)
            : s.encounter.round
          return {
            encounter: {
              ...s.encounter,
              currentTurnIndex: newIndex,
              round: newRound,
            }
          }
        })
      },

      reorderInitiative: (newOrder) => {
        set(s => ({
          encounter: {
            ...s.encounter,
            initiativeOrder: newOrder,
          }
        }))
      },

      addToInitiative: (id) => {
        set(s => {
          if (s.encounter.initiativeOrder.includes(id)) return s
          const combatant = s.encounter.combatants.find(c => c.id === id)
          if (!combatant) return s
          const isManual = s.encounter.initiativeMode === 'manual'
          const newTotal = isManual ? combatant.initiative.roll : combatant.initiative.roll + combatant.initiative.bonus
          const order = s.encounter.initiativeOrder
          const insertAt = order.findIndex(existingId => {
            const c = s.encounter.combatants.find(x => x.id === existingId)
            if (!c) return false
            const total = isManual ? c.initiative.roll : c.initiative.roll + c.initiative.bonus
            if (newTotal !== total) return newTotal > total
            return (combatant.abilities?.dex ?? 10) > (c.abilities?.dex ?? 10)
          })
          const newOrder = insertAt === -1
            ? [...order, id]
            : [...order.slice(0, insertAt), id, ...order.slice(insertAt)]
          return {
            encounter: {
              ...s.encounter,
              initiativeOrder: newOrder,
            }
          }
        })
      },

      // Selected combatant (for conditions panel etc.)
      selectedCombatantId: null,
      selectCombatant: (id) => set({ selectedCombatantId: id }),
    }),
    {
      name: 'dnd-tracker-encounter',
      partialize: (state) => ({
        encounter: state.encounter,
        savedEncounters: state.savedEncounters,
      }),
    }
  )
)

// Maps Open5e monster API data to our Combatant shape
export function mapApiToCombatant(data) {
  const avgHp = data.hit_points ?? 10
  const maxHp = data.hit_points ?? 10
  return {
    name: data.name ?? 'Unknown',
    hp: { current: avgHp, max: maxHp, temp: 0 },
    ac: data.armor_class ?? 10,
    initiative: {
      bonus: Math.floor(((data.dexterity ?? 10) - 10) / 2),
      roll: 0,
    },
    spellSaveDC: data.spell_save_dc ?? null,
    spellAttackBonus: data.spell_attack_bonus ?? null,
    legendary: data.legendary_actions
      ? { total: data.legendary_actions.length, remaining: data.legendary_actions.length }
      : null,
    abilities: {
      str: data.strength ?? 10,
      dex: data.dexterity ?? 10,
      con: data.constitution ?? 10,
      int: data.intelligence ?? 10,
      wis: data.wisdom ?? 10,
      cha: data.charisma ?? 10,
    },
  }
}
