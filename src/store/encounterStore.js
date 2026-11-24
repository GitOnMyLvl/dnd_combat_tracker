import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uuid } from '../utils/id'

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
  speed: 30,
  initiative: { bonus: 0, roll: 0 },
  spellSaveDC: null,
  spellAttackBonus: null,
  conditions: [],
  concentration: null,
  legendary: null,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  deathSaves: { successes: 0, failures: 0 },
  notes: '',
  exhaustion: 0,
  inspiration: false,
  _source: 'manual',
  _apiData: null,
  ...overrides,
})

// Applies `fn` to the combatant with `id`, leaving all others untouched.
const mapCombatant = (encounter, id, fn) => ({
  ...encounter,
  combatants: encounter.combatants.map(c => (c.id === id ? fn(c) : c)),
})

// Removes `id` from the initiative order while keeping the turn pointer on
// the same combatant (or on the next one, if the current combatant is removed).
const withoutInInitiative = (encounter, id) => {
  const order = encounter.initiativeOrder
  const removedAt = order.indexOf(id)
  if (removedAt === -1) return encounter
  const newOrder = order.filter(i => i !== id)
  let idx = encounter.currentTurnIndex
  if (removedAt < idx) idx -= 1
  if (newOrder.length === 0) idx = 0
  else if (idx >= newOrder.length) idx = 0
  return { ...encounter, initiativeOrder: newOrder, currentTurnIndex: idx }
}

const initiativeTotal = (c, isManual) =>
  isManual ? c.initiative.roll : c.initiative.roll + c.initiative.bonus

// Damage is absorbed by temporary HP first (5e PHB "Temporary Hit Points").
export function applyHPDelta(hp, delta) {
  if (delta >= 0) {
    return { ...hp, current: Math.min(hp.max, hp.current + delta) }
  }
  const damage = -delta
  const temp = hp.temp ?? 0
  const absorbed = Math.min(temp, damage)
  return {
    ...hp,
    temp: temp - absorbed,
    current: Math.max(0, hp.current - (damage - absorbed)),
  }
}

const DEMO_COMBATANTS = [
  { name: 'Thorin (Fighter)', type: 'ally', hp: { current: 44, max: 44, temp: 0 }, ac: 18, initiative: { bonus: 1, roll: 12 }, abilities: { str: 16, dex: 12, con: 16, int: 10, wis: 12, cha: 8 } },
  { name: 'Lyra (Wizard)', type: 'ally', hp: { current: 27, max: 27, temp: 0 }, ac: 13, initiative: { bonus: 3, roll: 15 }, spellSaveDC: 15, abilities: { str: 8, dex: 16, con: 14, int: 18, wis: 12, cha: 10 } },
  { name: 'Mira (Cleric)', type: 'ally', hp: { current: 33, max: 33, temp: 0 }, ac: 16, initiative: { bonus: 0, roll: 7 }, spellSaveDC: 14, abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 17, cha: 12 } },
  { name: 'Goblin Boss', type: 'enemy', hp: { current: 21, max: 21, temp: 0 }, ac: 17, initiative: { bonus: 2, roll: 14 }, abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 } },
  { name: 'Goblin 1', type: 'enemy', hp: { current: 7, max: 7, temp: 0 }, ac: 15, initiative: { bonus: 2, roll: 11 }, abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 } },
  { name: 'Goblin 2', type: 'enemy', hp: { current: 7, max: 7, temp: 0 }, ac: 15, initiative: { bonus: 2, roll: 4 }, abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 } },
]

export const useEncounterStore = create(
  persist(
    (set, get) => ({
      encounter: defaultEncounter(),
      savedEncounters: [],

      // Encounter management
      newEncounter: () => set({ encounter: defaultEncounter() }),

      // A small ready-to-run fight so first-time visitors can see how it works.
      loadDemoEncounter: () => {
        const encounter = { ...defaultEncounter(), name: 'Demo: Goblin Ambush' }
        encounter.combatants = DEMO_COMBATANTS.map(c => makeCombatant(c))
        set({ encounter, selectedCombatantId: null })
        encounter.combatants.forEach(c => get().addToInitiative(c.id))
      },

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
      // New combatants join the initiative order right away; they can be moved
      // out of combat (and back) from the Initiative module.
      addCombatant: (data = {}) => {
        const c = makeCombatant(data)
        set(s => ({
          encounter: {
            ...s.encounter,
            combatants: [...s.encounter.combatants, c],
          }
        }))
        get().addToInitiative(c.id)
        return c.id
      },

      removeCombatant: (id) => {
        set(s => {
          const encounter = withoutInInitiative(s.encounter, id)
          return {
            encounter: { ...encounter, combatants: encounter.combatants.filter(c => c.id !== id) },
            selectedCombatantId: s.selectedCombatantId === id ? null : s.selectedCombatantId,
          }
        })
      },

      updateCombatant: (id, changes) => {
        set(s => ({ encounter: mapCombatant(s.encounter, id, c => ({ ...c, ...changes })) }))
      },

      updateHP: (id, delta) => {
        set(s => ({ encounter: mapCombatant(s.encounter, id, c => ({ ...c, hp: applyHPDelta(c.hp, delta) })) }))
      },

      setHP: (id, value) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({
            ...c, hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, value)) },
          })),
        }))
      },

      toggleCondition: (id, condition) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({
            ...c,
            conditions: c.conditions.includes(condition)
              ? c.conditions.filter(x => x !== condition)
              : [...c.conditions, condition],
          })),
        }))
      },

      resetCombatantToApi: (id) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => {
            if (!c._apiData) return c
            return makeCombatant({
              id: c.id,
              type: c.type,
              _source: 'api',
              _apiData: c._apiData,
              ...mapApiToCombatant(c._apiData),
            })
          }),
        }))
      },

      // Initiative
      setInitiativeMode: (mode) => {
        set(s => ({ encounter: { ...s.encounter, initiativeMode: mode } }))
      },

      setInitiativeRoll: (id, roll) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({ ...c, initiative: { ...c.initiative, roll } })),
        }))
      },

      setExhaustion: (id, level) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({ ...c, exhaustion: Math.max(0, Math.min(10, level)) })),
        }))
      },

      toggleInspiration: (id) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({ ...c, inspiration: !c.inspiration })),
        }))
      },

      // Sorting before combat has started (round 1, first turn) starts at the top.
      // Mid-combat, the round is kept and the turn stays with the current combatant.
      sortInitiative: () => {
        set(s => {
          const { encounter } = s
          const isManual = encounter.initiativeMode === 'manual'
          const currentId = encounter.initiativeOrder[encounter.currentTurnIndex]
          const notStarted = encounter.round === 1 && encounter.currentTurnIndex === 0
          const sorted = encounter.initiativeOrder
            .map(id => encounter.combatants.find(c => c.id === id))
            .filter(Boolean)
            .sort((a, b) => {
              const diff = initiativeTotal(b, isManual) - initiativeTotal(a, isManual)
              if (diff !== 0) return diff
              return (b.abilities?.dex ?? 10) - (a.abilities?.dex ?? 10)
            })
            .map(c => c.id)
          const currentTurnIndex = notStarted ? 0 : Math.max(0, sorted.indexOf(currentId))
          return { encounter: { ...encounter, initiativeOrder: sorted, currentTurnIndex } }
        })
      },

      nextTurn: () => {
        set(s => {
          const len = s.encounter.initiativeOrder.length
          if (len === 0) return s
          const next = s.encounter.currentTurnIndex + 1
          return {
            encounter: {
              ...s.encounter,
              currentTurnIndex: next % len,
              round: next >= len ? s.encounter.round + 1 : s.encounter.round,
            }
          }
        })
      },

      prevTurn: () => {
        set(s => {
          const len = s.encounter.initiativeOrder.length
          if (len === 0) return s
          const prev = s.encounter.currentTurnIndex - 1
          return {
            encounter: {
              ...s.encounter,
              currentTurnIndex: prev < 0 ? len - 1 : prev,
              round: prev < 0 ? Math.max(1, s.encounter.round - 1) : s.encounter.round,
            }
          }
        })
      },

      // Keeps the turn with whoever currently has it.
      reorderInitiative: (newOrder) => {
        set(s => {
          const currentId = s.encounter.initiativeOrder[s.encounter.currentTurnIndex]
          const idx = newOrder.indexOf(currentId)
          return {
            encounter: {
              ...s.encounter,
              initiativeOrder: newOrder,
              currentTurnIndex: idx >= 0 ? idx : Math.min(s.encounter.currentTurnIndex, Math.max(0, newOrder.length - 1)),
            }
          }
        })
      },

      addToInitiative: (id) => {
        set(s => {
          const { encounter } = s
          if (encounter.initiativeOrder.includes(id)) return s
          const combatant = encounter.combatants.find(c => c.id === id)
          if (!combatant) return s
          const isManual = encounter.initiativeMode === 'manual'
          const newTotal = initiativeTotal(combatant, isManual)
          const order = encounter.initiativeOrder
          const insertAt = order.findIndex(existingId => {
            const c = encounter.combatants.find(x => x.id === existingId)
            if (!c) return false
            const total = initiativeTotal(c, isManual)
            if (newTotal !== total) return newTotal > total
            return (combatant.abilities?.dex ?? 10) > (c.abilities?.dex ?? 10)
          })
          const at = insertAt === -1 ? order.length : insertAt
          const newOrder = [...order.slice(0, at), id, ...order.slice(at)]
          // Inserting before (or at) the current turn shifts the pointer so the
          // same combatant keeps their turn. Before combat starts, stay at the top.
          const notStarted = encounter.round === 1 && encounter.currentTurnIndex === 0
          const shift = !notStarted && order.length > 0 && at <= encounter.currentTurnIndex ? 1 : 0
          return {
            encounter: {
              ...encounter,
              initiativeOrder: newOrder,
              currentTurnIndex: encounter.currentTurnIndex + shift,
            }
          }
        })
      },

      // Death saves
      setDeathSave: (id, type, value) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({
            ...c, deathSaves: { ...c.deathSaves, [type]: Math.max(0, Math.min(3, value)) },
          })),
        }))
      },

      resetDeathSaves: (id) => {
        set(s => ({
          encounter: mapCombatant(s.encounter, id, c => ({ ...c, deathSaves: { successes: 0, failures: 0 } })),
        }))
      },

      removeFromInitiative: (id) => {
        set(s => ({ encounter: withoutInInitiative(s.encounter, id) }))
      },

      // Selected combatant (for conditions panel etc.)
      selectedCombatantId: null,
      selectCombatant: (id) => set({ selectedCombatantId: id }),
    }),
    {
      name: 'dnd-tracker-encounter',
      version: 1,
      migrate: (persisted) => persisted,
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
    conditions: [],
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
