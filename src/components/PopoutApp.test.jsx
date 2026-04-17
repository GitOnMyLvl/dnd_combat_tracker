import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock stores
vi.mock('../store/encounterStore', () => ({
  useEncounterStore: Object.assign(() => ({}), {
    persist: { rehydrate: vi.fn() },
  }),
}))
vi.mock('../store/characterStore', () => ({
  useCharacterStore: Object.assign(() => ({}), {
    persist: { rehydrate: vi.fn() },
  }),
}))
vi.mock('../store/themeStore', () => ({
  applyTheme: vi.fn(),
  applyAccent: vi.fn(),
  useThemeStore: { setState: vi.fn() },
}))
vi.mock('./canvas/Canvas', () => ({
  MODULE_COMPONENTS: {
    DiceRoller: () => <div>DiceRoller</div>,
  },
}))

import PopoutApp from './PopoutApp'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { applyTheme, applyAccent, useThemeStore } from '../store/themeStore'

describe('PopoutApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.close = vi.fn()
  })

  it('renders the matching module component', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    expect(screen.getByText('DiceRoller')).toBeInTheDocument()
  })

  it('renders an error for an unknown type', () => {
    render(<PopoutApp type="Bogus" config={{}} />)
    expect(screen.getByText(/unknown module/i)).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('close button calls window.close', async () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(window.close).toHaveBeenCalledOnce()
  })

  it('Escape key calls window.close', async () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    await userEvent.keyboard('{Escape}')
    expect(window.close).toHaveBeenCalledOnce()
  })

  it('rehydrates encounterStore on storage event for encounter key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-encounter' }))
    })
    expect(useEncounterStore.persist.rehydrate).toHaveBeenCalledOnce()
  })

  it('rehydrates characterStore on storage event for characters key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-characters' }))
    })
    expect(useCharacterStore.persist.rehydrate).toHaveBeenCalledOnce()
  })

  it('applies theme on storage event for theme key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-theme', newValue: 'light' }))
    })
    expect(applyTheme).toHaveBeenCalledWith('light')
    expect(useThemeStore.setState).toHaveBeenCalledWith({ theme: 'light' })
  })

  it('applies accent on storage event for accent key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-accent', newValue: '#ff0000' }))
    })
    expect(applyAccent).toHaveBeenCalledWith('#ff0000')
    expect(useThemeStore.setState).toHaveBeenCalledWith({ accent: '#ff0000' })
  })

  it('removes storage listener on unmount', () => {
    const { unmount } = render(<PopoutApp type="DiceRoller" config={{}} />)
    unmount()
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-encounter' }))
    })
    expect(useEncounterStore.persist.rehydrate).not.toHaveBeenCalled()
  })
})
