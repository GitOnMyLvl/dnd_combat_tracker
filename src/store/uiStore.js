import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      showModulePicker: false,
      openModulePicker: () => set({ showModulePicker: true }),
      closeModulePicker: () => set({ showModulePicker: false }),

      // Returning visitors go straight to their table; the logo leads back.
      hasEntered: false,
      enterApp: () => set({ hasEntered: true }),
      resetToLanding: () => set({ hasEntered: false }),

      showGuide: true,
      dismissGuide: () => set({ showGuide: false }),
    }),
    {
      name: 'dnd-tracker-ui',
      partialize: (s) => ({ hasEntered: s.hasEntered, showGuide: s.showGuide }),
    }
  )
)
