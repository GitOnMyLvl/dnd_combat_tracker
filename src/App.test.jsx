import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useUIStore } from './store/uiStore'

vi.mock('./components/TopBar', () => ({ default: () => <div>TopBar</div> }))
vi.mock('./components/canvas/Canvas', () => ({
  default: () => <div>Canvas</div>,
  MODULE_COMPONENTS: { DiceRoller: () => <div>DiceRoller</div> },
}))
vi.mock('./components/PopoutApp', () => ({ default: ({ type }) => <div>PopoutApp:{type}</div> }))
vi.mock('./components/landing/LandingPage', () => ({ default: () => <div>LandingPage</div> }))

import App from './App'

describe('App', () => {
  const setSearch = (search) => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search },
      writable: true,
    })
  }

  beforeEach(() => {
    useUIStore.setState({ hasEntered: false })
  })

  it('renders LandingPage when not entered and no popout param', () => {
    setSearch('')
    render(<App />)
    expect(screen.getByText('LandingPage')).toBeInTheDocument()
    expect(screen.queryByText('TopBar')).not.toBeInTheDocument()
  })

  it('renders normal layout when entered and no popout param', () => {
    setSearch('')
    useUIStore.setState({ hasEntered: true })
    render(<App />)
    expect(screen.getByText('TopBar')).toBeInTheDocument()
    expect(screen.getByText('Canvas')).toBeInTheDocument()
    expect(screen.queryByText('LandingPage')).not.toBeInTheDocument()
  })

  it('renders PopoutApp when ?popout param is present', () => {
    setSearch('?popout=DiceRoller&config=%7B%7D')
    render(<App />)
    expect(screen.getByText('PopoutApp:DiceRoller')).toBeInTheDocument()
    expect(screen.queryByText('TopBar')).not.toBeInTheDocument()
    expect(screen.queryByText('LandingPage')).not.toBeInTheDocument()
  })
})
