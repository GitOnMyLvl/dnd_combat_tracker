import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../store/layoutStore', () => ({
  useLayoutStore: () => ({
    removeModule: vi.fn(),
    toggleMinimize: vi.fn(),
  }),
}))

import ModuleWrapper from './ModuleWrapper'

describe('ModuleWrapper pop-out button', () => {
  beforeEach(() => {
    window.open = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173', pathname: '/' },
      writable: true,
    })
  })

  it('renders the pop-out button', () => {
    render(
      <ModuleWrapper id="test-1" type="DiceRoller" config={{}}>
        <div>content</div>
      </ModuleWrapper>
    )
    expect(screen.getByTitle('Open in new window')).toBeInTheDocument()
  })

  it('calls window.open with correct popout URL on click', async () => {
    render(
      <ModuleWrapper id="test-1" type="DiceRoller" config={{ foo: 'bar' }}>
        <div>content</div>
      </ModuleWrapper>
    )
    await userEvent.click(screen.getByTitle('Open in new window'))
    expect(window.open).toHaveBeenCalledOnce()
    const [url, target, features] = window.open.mock.calls[0]
    expect(url).toContain('popout=DiceRoller')
    expect(url).toContain('config=')
    expect(target).toBe('_blank')
    expect(features).toContain('popup=yes')
  })

  it('encodes the config correctly in the URL', async () => {
    render(
      <ModuleWrapper id="test-1" type="CombatantTable" config={{ tableType: 'enemy' }}>
        <div>content</div>
      </ModuleWrapper>
    )
    await userEvent.click(screen.getByTitle('Open in new window'))
    const [url] = window.open.mock.calls[0]
    const params = new URLSearchParams(url.split('?')[1])
    const decoded = JSON.parse(decodeURIComponent(params.get('config')))
    expect(decoded).toEqual({ tableType: 'enemy' })
  })
})
