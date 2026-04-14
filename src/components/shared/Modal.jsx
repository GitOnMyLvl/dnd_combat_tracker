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
        padding: 16,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
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
      style={{ background: 'rgba(0,0,0,0.75)', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth, padding: 20, boxShadow: '0 24px 64px var(--c-shadow)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
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
