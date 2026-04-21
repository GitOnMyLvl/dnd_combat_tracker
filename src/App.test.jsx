import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('./components/TopBar', () => ({ default: () => <div>TopBar</div> }))
vi.mock('./components/canvas/Canvas', () => ({
  default: () => <div>Canvas</div>,
  MODULE_COMPONENTS: { DiceRoller: () => <div>DiceRoller</div> },
}))
vi.mock('./components/PopoutApp', () => ({ default: ({ type }) => <div>PopoutApp:{type}</div> }))

import App from './App'

describe('App', () => {
  const setSearch = (search) => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search },
      writable: true,
    })
  }

  it('renders normal layout when no ?popout param', () => {
    setSearch('')
    render(<App />)
    expect(screen.getByText('TopBar')).toBeInTheDocument()
    expect(screen.getByText('Canvas')).toBeInTheDocument()
  })

  it('renders PopoutApp when ?popout param is present', () => {
    setSearch('?popout=DiceRoller&config=%7B%7D')
    render(<App />)
    expect(screen.getByText('PopoutApp:DiceRoller')).toBeInTheDocument()
    expect(screen.queryByText('TopBar')).not.toBeInTheDocument()
  })
})
