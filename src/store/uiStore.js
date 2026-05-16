import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      showModulePicker: false,
      openModulePicker: () => set({ showModulePicker: true }),
      closeModulePicker: () => set({ showModulePicker: false }),

      hasEntered: false,
      enterApp: () => set({ hasEntered: true }),
      resetToLanding: () => set({ hasEntered: false }),

      hasOnboarded: false,
      showOnboarding: false,
      onboardingStep: 0,
      startOnboarding: () => set({ showOnboarding: true, onboardingStep: 0 }),
      nextStep: () => set(s => ({ onboardingStep: s.onboardingStep + 1 })),
      prevStep: () => set(s => ({ onboardingStep: Math.max(0, s.onboardingStep - 1) })),
      goToStep: (i) => set({ onboardingStep: Math.max(0, i) }),
      completeOnboarding: () => set({ showOnboarding: false, onboardingStep: 0, hasOnboarded: true }),
      skipOnboarding: () => set({ showOnboarding: false, onboardingStep: 0, hasOnboarded: true }),
    }),
    {
      name: 'dnd-tracker-ui',
      partialize: (state) => ({ hasOnboarded: state.hasOnboarded }),
    }
  )
)
