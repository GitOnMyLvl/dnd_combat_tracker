import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('./canvas/Canvas', () => ({
  MODULE_COMPONENTS: {
    DiceRoller: () => <div>DiceRoller</div>,
  },
}))

import PopoutApp from './PopoutApp'

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
})
