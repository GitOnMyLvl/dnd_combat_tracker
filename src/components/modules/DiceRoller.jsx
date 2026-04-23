import { useState, useRef, useEffect } from 'react'
import { rollDie } from '../../utils/dice'

const DICE = [4, 6, 8, 10, 12, 20, 100]

export default function DiceRoller() {
  const [history, setHistory] = useState([])
  const [advantage, setAdvantage] = useState('normal')
  const [pocket, setPocket] = useState(() => Object.fromEntries(DICE.map(d => [d, 0])))
  const [flash, setFlash] = useState(0)
  const flashTimer = useRef(null)

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  const addRoll = (label, total, breakdown, kind) => {
    const entry = { label, total, breakdown, kind, id: Date.now() + Math.random() }
    setHistory(h => [entry, ...h].slice(0, 20))
    setFlash(f => f + 1)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(0), 450)
  }

  const rollSingle = (sides) => {
    if (advantage !== 'normal' && sides === 20) {
      const r1 = rollDie(20), r2 = rollDie(20)
      const total = advantage === 'adv' ? Math.max(r1, r2) : Math.min(r1, r2)
      const tag = advantage === 'adv' ? 'ADV' : 'DIS'
      addRoll(`d20 · ${tag}`, total, `[${r1}, ${r2}]`, 'd20')
    } else {
      const r = rollDie(sides)
      addRoll(`d${sides}`, r, `[${r}]`, sides === 20 ? 'd20' : 'die')
    }
  }

  const setCount = (sides, raw) => {
    const n = Math.max(0, Math.min(99, parseInt(raw || '0', 10) || 0))
    setPocket(p => ({ ...p, [sides]: n }))
  }
  const bumpCount = (sides, delta) => {
    setPocket(p => ({ ...p, [sides]: Math.max(0, Math.min(99, (p[sides] || 0) + delta)) }))
  }

  const pocketTotalDice = DICE.reduce((a, d) => a + (pocket[d] || 0), 0)

  const rollPocket = () => {
    if (pocketTotalDice === 0) return
    const labelParts = []
    const breakdownParts = []
    let total = 0
    for (const d of DICE) {
      const n = pocket[d]
      if (!n) continue
      const rolls = Array.from({ length: n }, () => rollDie(d))
      total += rolls.reduce((a, b) => a + b, 0)
      labelParts.push(`${n}d${d}`)
      breakdownParts.push(`[${rolls.join(',')}]`)
    }
    addRoll(labelParts.join(' + '), total, breakdownParts.join('  '), 'pocket')
  }

  const clearPocket = () => setPocket(Object.fromEntries(DICE.map(d => [d, 0])))

  const last = history[0]
  const isNat20 = last && last.kind === 'd20' && /\[20/.test(last.breakdown)
  const isNat1  = last && last.kind === 'd20' && /^\[1[,\]]/.test(last.breakdown)

  const heroColor  = isNat20 ? 'var(--c-success)' : isNat1 ? 'var(--c-danger)' : 'var(--c-accent)'
  const heroBg     = isNat20 ? 'rgba(74,222,128,0.09)' : isNat1 ? 'var(--c-danger-dim)' : 'var(--c-elevated)'
  const heroBorder = isNat20 ? 'var(--c-success)' : isNat1 ? 'var(--c-danger)' : 'var(--c-border)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 'var(--sp-2)' }}>
      {/* Hero result */}
      <div
        key={flash}
        style={{
          flexShrink: 0,
          background: heroBg,
          border: `1px solid ${heroBorder}`,
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: 64,
          transition: 'background 0.18s, border-color 0.18s',
          animation: flash ? 'dr-pop 0.35s ease-out' : undefined,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--c-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            {last ? last.label : 'Ready to roll'}
          </div>
          <div style={{
            fontSize: '0.75rem', color: 'var(--c-muted2)', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {last ? last.breakdown : 'Tap a die, or fill the pocket below'}
          </div>
        </div>
        <div
          key={flash}
          className="display"
          style={{
            fontSize: isNat20 || isNat1 ? '2.4rem' : '2.1rem',
            fontWeight: 700,
            color: heroColor,
            lineHeight: 1,
            letterSpacing: '0.02em',
            minWidth: 56,
            textAlign: 'right',
            transformOrigin: 'center right',
            animation: flash ? 'dr-glow 0.6s ease-out' : undefined,
          }}
        >
          {last ? last.total : '—'}
        </div>
      </div>

      <style>{`
        @keyframes dr-pop { 0% { transform: scale(0.985); } 60% { transform: scale(1.01); } 100% { transform: scale(1); } }
        @keyframes dr-glow {
          0%   { text-shadow: 0 0 0 transparent; transform: scale(1); }
          35%  { text-shadow: 0 0 20px color-mix(in srgb, currentColor 70%, transparent), 0 0 4px currentColor; transform: scale(1.1); }
          100% { text-shadow: 0 0 0 transparent; transform: scale(1); }
        }
      `}</style>

      {/* Dice + pocket grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, flexShrink: 0 }}>
        {DICE.map(d => {
          const count = pocket[d] || 0
          const active = count > 0
          return (
            <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => rollSingle(d)}
                title={`Roll 1d${d}`}
                aria-label={`Roll 1d${d}`}
                style={{
                  background: active ? 'var(--c-accent-soft)' : 'var(--c-elevated)',
                  border: `1px solid ${active ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  borderRadius: 9,
                  color: active ? 'var(--c-accent)' : 'var(--c-text)',
                  minHeight: 40,
                  minWidth: 'unset',
                  padding: 0,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.02em',
                  transition: 'background 0.12s, border-color 0.12s, color 0.12s, transform 0.05s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--c-hover)'
                    e.currentTarget.style.borderColor = 'var(--c-accent)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--c-elevated)'
                    e.currentTarget.style.borderColor = 'var(--c-border)'
                  }
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                d{d}
              </button>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--c-elevated)',
                border: `1px solid ${active ? 'var(--c-accent)' : 'var(--c-border)'}`,
                borderRadius: 7,
                overflow: 'hidden',
                height: 28,
              }}>
                <button
                  onClick={() => bumpCount(d, -1)}
                  tabIndex={-1}
                  aria-label={`Decrease d${d} count`}
                  style={{
                    minHeight: 26, minWidth: 20, height: 26, padding: 0, border: 'none',
                    background: 'transparent', color: 'var(--c-muted)', fontSize: '0.9rem',
                    borderRadius: 0, fontWeight: 700,
                  }}
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={count === 0 ? '' : count}
                  placeholder="0"
                  onChange={e => setCount(d, e.target.value.replace(/[^0-9]/g, ''))}
                  aria-label={`d${d} pocket count`}
                  style={{
                    flex: 1, minWidth: 0, width: '100%',
                    border: 'none', background: 'transparent',
                    textAlign: 'center', padding: 0, height: 26,
                    fontSize: '0.78rem', fontWeight: 700,
                    color: active ? 'var(--c-accent)' : 'var(--c-muted2)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <button
                  onClick={() => bumpCount(d, 1)}
                  tabIndex={-1}
                  aria-label={`Increase d${d} count`}
                  style={{
                    minHeight: 26, minWidth: 20, height: 26, padding: 0, border: 'none',
                    background: 'transparent', color: 'var(--c-muted)', fontSize: '0.85rem',
                    borderRadius: 0, fontWeight: 700,
                  }}
                >+</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pocket actions */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button
          onClick={rollPocket}
          disabled={pocketTotalDice === 0}
          className="btn-primary"
          style={{
            flex: 1, minHeight: 36, minWidth: 'unset',
            fontSize: '0.82rem', letterSpacing: '0.04em', fontWeight: 600,
          }}
        >
          Roll dice{pocketTotalDice > 0 ? ` (${pocketTotalDice})` : ''}
        </button>
        <button
          onClick={clearPocket}
          disabled={pocketTotalDice === 0}
          className="btn-ghost"
          style={{ minHeight: 36, minWidth: 'unset', padding: '0 14px', fontSize: '0.78rem' }}
        >
          Clear
        </button>
      </div>

      {/* Advantage segmented (only meaningful for d20 single-click) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, flexShrink: 0 }}>
        {[
          { mode: 'adv',    label: 'Advantage',    color: 'var(--c-success)' },
          { mode: 'normal', label: 'Normal',       color: 'var(--c-accent)' },
          { mode: 'dis',    label: 'Disadvantage', color: 'var(--c-danger)' },
        ].map(({ mode, label, color }) => (
          <button
            key={mode}
            onClick={() => setAdvantage(mode)}
            title={mode === 'normal' ? 'Normal' : `${label} — d20 only`}
            style={{
              minHeight: 34, minWidth: 'unset', fontSize: '0.76rem', fontWeight: 600, borderRadius: 8,
              border: `1px solid ${advantage === mode ? color : 'var(--c-border)'}`,
              background: advantage === mode ? `color-mix(in srgb, ${color} 14%, transparent)` : 'transparent',
              color: advantage === mode ? color : 'var(--c-muted)',
              letterSpacing: '0.03em',
              transition: 'all 0.12s',
            }}
          >{label}</button>
        ))}
      </div>

      <hr className="divider flex-shrink-0" />

      {/* History */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {history.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '10px 0', fontStyle: 'italic' }}>
            History will appear here.
          </p>
        )}
        {history.map((h) => {
          const hiNat20 = h.kind === 'd20' && /\[20/.test(h.breakdown)
          const hiNat1  = h.kind === 'd20' && /^\[1[,\]]/.test(h.breakdown)
          const totalColor = hiNat20 ? 'var(--c-success)' : hiNat1 ? 'var(--c-danger)' : h.kind === 'error' ? 'var(--c-danger)' : 'var(--c-muted2)'
          return (
            <div
              key={h.id}
              className="flex items-center justify-between"
              style={{ padding: '5px 8px', borderRadius: 6, minHeight: 30, fontSize: '0.8rem' }}
            >
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <span style={{ fontWeight: 500, color: 'var(--c-muted2)' }}>{h.label}</span>
                <span style={{ color: 'var(--c-muted)', fontSize: '0.72rem', marginLeft: 6 }}>{h.breakdown}</span>
              </div>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: totalColor, marginLeft: 8 }}>
                {h.total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
