import { create } from 'zustand'

const THEME_KEY  = 'dnd-tracker-theme'
const ACCENT_KEY = 'dnd-tracker-accent'

const DEFAULT_ACCENT = '#60a5fa' // soft blue

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

function applyAccent(color) {
  const root = document.documentElement.style
  root.setProperty('--c-accent', color)
  root.setProperty('--c-accent-dim', hexToRgba(color, 0.14))
}

// Apply saved values immediately on load
const savedTheme  = localStorage.getItem(THEME_KEY)  || 'dark'
const savedAccent = localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT
applyTheme(savedTheme)
applyAccent(savedAccent)

export const useThemeStore = create((set) => ({
  theme:  savedTheme,
  accent: savedAccent,

  toggleTheme: () => set(state => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, next)
    applyTheme(next)
    return { theme: next }
  }),

  setAccent: (color) => {
    localStorage.setItem(ACCENT_KEY, color)
    applyAccent(color)
    set({ accent: color })
  },
}))
