import { useEffect } from 'react'

export default function Modal({ onClose, title, children, maxWidth = 380, inline = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  if (inline) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'var(--c-bg)', overflowY: 'auto',
        padding: 'var(--sp-5)',
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="display" style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.06em' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}
          >✕</button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', padding: 'var(--sp-4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth, padding: 'var(--sp-5)', boxShadow: 'var(--shadow-pop)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="display" style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.06em' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
