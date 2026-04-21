import { useState } from 'react'
import { rollDie, parseAndRoll } from '../../utils/dice'

const DICE = [4, 6, 8, 10, 12, 20, 100]

export default function DiceRoller() {
  const [history, setHistory] = useState([])
  const [expr, setExpr] = useState('')
  const [advantage, setAdvantage] = useState('normal')

  const addRoll = (label, total, breakdown) =>
    setHistory(h => [{ label, total, breakdown, id: Date.now() }, ...h].slice(0, 20))

  const rollSingle = (sides) => {
    if (advantage !== 'normal' && sides === 20) {
      const r1 = rollDie(20), r2 = rollDie(20)
      const total = advantage === 'adv' ? Math.max(r1, r2) : Math.min(r1, r2)
      addRoll(`d20 ${advantage === 'adv' ? '(Adv)' : '(Dis)'}`, total, `[${r1}, ${r2}]`)
    } else {
      const r = rollDie(sides)
      addRoll(`d${sides}`, r, `[${r}]`)
    }
  }

  const rollExpr = () => {
    const result = parseAndRoll(expr)
    if (!result) { addRoll('Error', '?', `Invalid: "${expr}"`); return }
    addRoll(expr, result.total, result.breakdown)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 'var(--sp-2)' }}>
      {/* Dice grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, flexShrink: 0 }}>
        {DICE.map(d => (
          <button
            key={d}
            onClick={() => rollSingle(d)}
            style={{
              background: 'var(--c-elevated)', border: '1px solid var(--c-border)',
              borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
              color: 'var(--c-text)', minHeight: 36, minWidth: 'unset',
              transition: 'background 0.1s, border-color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-hover)'; e.currentTarget.style.borderColor = 'var(--c-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-elevated)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
          >d{d}</button>
        ))}
      </div>

      {/* Advantage toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, flexShrink: 0 }}>
        {[
          { mode: 'normal', label: 'Normal', color: 'var(--c-accent)' },
          { mode: 'adv', label: 'Advantage', color: 'var(--c-success)' },
          { mode: 'dis', label: 'Disadvantage', color: 'var(--c-danger)' },
        ].map(({ mode, label, color }) => (
          <button
            key={mode}
            onClick={() => setAdvantage(mode)}
            style={{
              minHeight: 36, minWidth: 'unset', fontSize: '0.8rem', fontWeight: 600, borderRadius: 7,
              border: `1px solid ${advantage === mode ? color : 'var(--c-border)'}`,
              background: advantage === mode ? `${color}18` : 'transparent',
              color: advantage === mode ? color : 'var(--c-muted)',
              transition: 'all 0.1s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Custom expression */}
      <div className="flex" style={{ gap: 5, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="e.g. 2d6+3+4d8+7"
          value={expr}
          onChange={e => setExpr(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && rollExpr()}
          style={{ flex: 1, minHeight: 36 }}
        />
        <button onClick={rollExpr} className="btn-primary" style={{ minHeight: 36, minWidth: 'unset', padding: '0 14px' }}>Roll</button>
      </div>

      <hr className="divider flex-shrink-0" />

      {/* History */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {history.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>Roll something!</p>
        )}
        {history.map((h, i) => {
          const isNat20 = h.total === 20 && h.label.includes('d20')
          const isNat1 = h.total === 1 && h.label.includes('d20')
          return (
            <div
              key={h.id}
              className="flex items-center justify-between"
              style={{
                padding: '6px 10px', borderRadius: 7,
                background: i === 0 ? 'var(--c-elevated)' : 'transparent',
                border: '1px solid transparent',
                minHeight: 36,
              }}
            >
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: i === 0 ? 600 : 400 }}>{h.label}</span>
                <span style={{ color: 'var(--c-muted)', fontSize: '0.78rem', marginLeft: 6 }}>{h.breakdown}</span>
              </div>
              <span style={{
                fontWeight: 800, fontSize: i === 0 ? '1.2rem' : '0.95rem',
                color: isNat20 ? 'var(--c-accent)' : isNat1 ? 'var(--c-danger)' : i === 0 ? 'var(--c-text)' : 'var(--c-muted2)',
              }}>
                {h.total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
