import { create } from 'zustand'

const STORAGE_KEY = 'dnd-tracker-theme'

function applyTheme(theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

// Apply saved theme immediately
const saved = localStorage.getItem(STORAGE_KEY) || 'dark'
applyTheme(saved)

export const useThemeStore = create((set) => ({
  theme: saved,
  toggleTheme: () => set(state => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    return { theme: next }
  }),
}))
