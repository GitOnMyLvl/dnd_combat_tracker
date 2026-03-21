import { useState, useEffect, useRef } from 'react'
import { useThemeStore } from '../store/themeStore'

// Sorted by hue around the colour wheel (red → pink → orange → yellow → green → teal → sky → blue → purple → lavender)
// Three brightness levels within each hue family
const PRESETS = [
  '#be123c', '#f472b6', '#ec4899',  // red → pink
  '#92400e', '#f59e0b', '#fbbf24',  // dark orange → amber → yellow
  '#065f46', '#10b981', '#4ade80',  // dark green → emerald → light green
  '#2dd4bf', '#38bdf8', '#1e3a5f',  // teal → sky → navy
  '#1d4ed8', '#3b82f6', '#60a5fa',  // dark blue → mid blue → light blue
  '#6d28d9', '#8b5cf6', '#c084fc',  // dark purple → violet → lavender
]

export default function AccentPicker() {
  const { accent, setAccent } = useThemeStore()
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(accent)
  const ref = useRef(null)

  // Sync hex input when accent changes externally
  useEffect(() => { setHex(accent) }, [accent])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const apply = (color) => {
    // Basic hex validation
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      setAccent(color)
      setHex(color)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="btn-ghost"
        title="Accent color"
        style={{
          minHeight: 32, minWidth: 'unset', padding: '0 10px',
          display: 'flex', alignItems: 'center', gap: 7,
          borderColor: open ? 'var(--c-border-strong)' : undefined,
          background: open ? 'var(--c-elevated)' : undefined,
        }}
      >
        <span style={{ fontSize: '0.8rem' }}>Color</span>
        <div style={{
          width: 14, height: 14, borderRadius: 4,
          background: accent,
          border: '1.5px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }} />
      </button>

      {/* Popover */}
      {open && (
        <div
          className="card"
          style={{
            position: 'absolute', top: 42, right: 0, zIndex: 60,
            padding: 14, width: 224,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div className="label" style={{ marginBottom: 10 }}>Accent Color</div>

          {/* Swatch grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 12 }}>
            {PRESETS.map(color => (
              <button
                key={color}
                onClick={() => apply(color)}
                title={color}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: 6,
                  background: color, border: 'none', padding: 0,
                  minHeight: 'unset', minWidth: 'unset',
                  outline: accent === color ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: 2,
                  transform: accent === color ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.1s, outline 0.1s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (accent !== color) e.currentTarget.style.transform = 'scale(1.12)' }}
                onMouseLeave={e => { if (accent !== color) e.currentTarget.style.transform = 'scale(1)' }}
              />
            ))}
          </div>

          {/* Hex input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : accent,
              border: '1px solid var(--c-border-strong)',
            }} />
            <input
              value={hex}
              onChange={e => {
                setHex(e.target.value)
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) apply(e.target.value)
              }}
              onKeyDown={e => e.key === 'Enter' && apply(hex)}
              placeholder="#60a5fa"
              style={{ flex: 1, minHeight: 30, fontSize: '0.8rem', padding: '2px 8px', fontFamily: 'monospace' }}
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
