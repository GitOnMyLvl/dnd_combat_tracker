import { create } from 'zustand'

export const useUIStore = create((set) => ({
  showModulePicker: false,
  openModulePicker: () => set({ showModulePicker: true }),
  closeModulePicker: () => set({ showModulePicker: false }),

  hasEntered: false,
  enterApp: () => set({ hasEntered: true }),
  resetToLanding: () => set({ hasEntered: false }),
}))
