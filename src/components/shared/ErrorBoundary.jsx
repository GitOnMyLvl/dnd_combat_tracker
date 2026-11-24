import { Component } from 'react'

// Contains render errors so one broken module doesn't blank the whole app.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Module crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    const { fullPage, label = 'This panel' } = this.props
    return (
      <div
        role="alert"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: 16, textAlign: 'center',
          height: fullPage ? '100dvh' : '100%',
          background: fullPage ? 'var(--c-bg)' : undefined,
          color: 'var(--c-text)',
        }}
      >
        <strong style={{ color: 'var(--c-danger)' }}>{label} ran into an error.</strong>
        <span style={{ color: 'var(--c-muted)', fontSize: '0.8rem', maxWidth: 360 }}>
          Your encounter data is still saved.
        </span>
        <button
          className="btn-ghost"
          onClick={() => (fullPage ? window.location.reload() : this.setState({ error: null }))}
        >
          {fullPage ? 'Reload' : 'Try again'}
        </button>
      </div>
    )
  }
}
