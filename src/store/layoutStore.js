import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

// Default widths per module type
const DEFAULT_SIZES = {
  InitiativeTracker: { w: 3, h: 8 },
  CombatantTable:    { w: 5, h: 8 },
  ConditionsPanel:   { w: 4, h: 6 },
  DiceRoller:        { w: 4, h: 7 },
  NotesPad:          { w: 4, h: 6 },
  PartyManager:      { w: 4, h: 8 },
}

export const useLayoutStore = create(
  persist(
    (set) => ({
      modules: [], // start empty — user adds what they need

      setLayout: (modules) => set({ modules }),

      addModule: (type, config = {}) => {
        const id = `${type.toLowerCase()}-${uuid().slice(0, 6)}`
        const { w, h } = DEFAULT_SIZES[type] ?? { w: 4, h: 6 }
        const newModule = { i: id, type, x: 0, y: Infinity, w, h, config }
        set(s => ({ modules: [...s.modules, newModule] }))
      },

      clearModules: () => set({ modules: [] }),

      removeModule: (id) => {
        set(s => ({ modules: s.modules.filter(m => m.i !== id) }))
      },

      updateModuleConfig: (id, config) => {
        set(s => ({
          modules: s.modules.map(m => m.i === id ? { ...m, config: { ...m.config, ...config } } : m)
        }))
      },

      toggleMinimize: (id) => {
        set(s => ({
          modules: s.modules.map(m => m.i === id ? { ...m, minimized: !m.minimized } : m)
        }))
      },
    }),
    { name: 'dnd-tracker-layout' }
  )
)
