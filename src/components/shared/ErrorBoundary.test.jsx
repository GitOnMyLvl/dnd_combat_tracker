import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

let shouldThrow = true
function Boom() {
  if (shouldThrow) throw new Error('kaboom')
  return <div>recovered</div>
}

describe('ErrorBoundary', () => {
  it('shows a fallback instead of crashing and can recover', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('This panel ran into an error.')

    shouldThrow = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })
})
