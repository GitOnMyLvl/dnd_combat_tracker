import { useState, useMemo } from 'react'
import { useEncounterStore } from '../../store/encounterStore'

export function computeApplied(rawAmount, mode, saveForHalf) {
  const n = parseInt(rawAmount, 10)
  if (isNaN(n) || n <= 0) return 0
  if (mode === 'heal') return n
  return saveForHalf ? Math.floor(n / 2) : n
}

function CombatantRow({ c, selected, onToggle }) {
  const dying = c.hp.current === 0
  const bloodied = !dying && c.hp.current <= Math.floor(c.hp.max / 2)
  const hpColor = dying ? 'var(--c-danger)' : bloodied ? '#f97316' : 'var(--c-text)'
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        padding: '6px 10px', borderRadius: 8,
        border: selected ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
        background: selected ? 'var(--c-accent-dim)' : 'var(--c-elevated)',
        minHeight: 40, minWidth: 'unset',
        textAlign: 'left', cursor: 'pointer',
        opacity: dying ? 0.65 : 1,
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16, height: 16, borderRadius: 4,
          background: selected ? 'var(--c-accent)' : 'transparent',
          border: `1.5px solid ${selected ? 'var(--c-accent)' : 'var(--c-border-strong)'}`,
          color: '#fff', fontSize: '0.7rem', fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >{selected ? '✓' : ''}</span>
      <span style={{ color: c.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.65rem', flexShrink: 0 }}>●</span>
      <span style={{
        flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {c.name}
      </span>
      <span style={{ fontSize: '0.78rem', color: hpColor, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {c.hp.current}<span style={{ color: 'var(--c-muted)' }}>/{c.hp.max}</span>
      </span>
    </button>
  )
}

export default function AoeDamage() {
  const combatants = useEncounterStore(s => s.encounter.combatants)
  const updateHP = useEncounterStore(s => s.updateHP)

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('damage')
  const [saveForHalf, setSaveForHalf] = useState(false)
  const [flash, setFlash] = useState(null)

  const allies  = useMemo(() => combatants.filter(c => c.type === 'ally'), [combatants])
  const enemies = useMemo(() => combatants.filter(c => c.type === 'enemy'), [combatants])

  const applied = computeApplied(amount, mode, saveForHalf)
  const selectedCount = selectedIds.size
  const canApply = applied > 0 && selectedCount > 0

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = (list) => setSelectedIds(prev => {
    const next = new Set(prev)
    list.forEach(c => next.add(c.id))
    return next
  })

  const clear = () => setSelectedIds(new Set())

  const apply = () => {
    if (!canApply) return
    const delta = mode === 'heal' ? applied : -applied
    selectedIds.forEach(id => updateHP(id, delta))
    setFlash({
      mode, amount: applied, count: selectedCount, halved: mode === 'damage' && saveForHalf,
    })
    setAmount('')
    setSelectedIds(new Set())
    setTimeout(() => setFlash(null), 1800)
  }

  const modeColor = mode === 'heal' ? 'var(--c-success)' : 'var(--c-danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 'var(--sp-2)' }}>
      {/* Mode toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)', flexShrink: 0 }}>
        {[
          { key: 'damage', label: 'Damage', color: 'var(--c-danger)' },
          { key: 'heal',   label: 'Heal',   color: 'var(--c-success)' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              minHeight: 36, minWidth: 'unset', fontSize: '0.85rem', fontWeight: 600, borderRadius: 7,
              border: `1px solid ${mode === m.key ? m.color : 'var(--c-border)'}`,
              background: mode === m.key ? `${m.color}22` : 'transparent',
              color: mode === m.key ? m.color : 'var(--c-muted2)',
              transition: 'all 0.12s',
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* Amount + Apply */}
      <div className="flex" style={{ gap: 'var(--sp-1)', flexShrink: 0 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Amount"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && apply()}
          style={{ flex: 1, minHeight: 38, fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}
          aria-label="Amount"
        />
        <button
          onClick={apply}
          disabled={!canApply}
          style={{
            minHeight: 38, minWidth: 'unset', padding: '0 18px',
            fontSize: '0.85rem', fontWeight: 700, borderRadius: 7, border: 'none',
            background: canApply ? modeColor : 'var(--c-elevated)',
            color: canApply ? '#fff' : 'var(--c-muted)',
            cursor: canApply ? 'pointer' : 'not-allowed',
            transition: 'filter 0.12s, transform 0.06s',
          }}
          onMouseEnter={e => { if (canApply) e.currentTarget.style.filter = 'brightness(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
        >
          {mode === 'heal' ? '+' : '−'}{applied || 0}
        </button>
      </div>

      {/* Save for half (damage mode only) */}
      {mode === 'damage' && (
        <label
          className="flex items-center"
          style={{
            gap: 'var(--sp-2)', fontSize: '0.82rem',
            padding: '6px 10px', borderRadius: 7,
            background: saveForHalf ? 'var(--c-accent-soft)' : 'transparent',
            border: `1px solid ${saveForHalf ? 'var(--c-accent)' : 'var(--c-border)'}`,
            color: saveForHalf ? 'var(--c-accent)' : 'var(--c-muted2)',
            cursor: 'pointer', userSelect: 'none', minHeight: 34,
            transition: 'all 0.12s',
          }}
        >
          <input
            type="checkbox"
            checked={saveForHalf}
            onChange={e => setSaveForHalf(e.target.checked)}
            style={{ width: 16, height: 16, minHeight: 'unset', accentColor: 'var(--c-accent)', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600 }}>Save for half</span>
          {saveForHalf && amount && (
            <span style={{ color: 'var(--c-muted)', fontSize: '0.78rem', marginLeft: 'auto' }}>
              {amount} → {applied}
            </span>
          )}
        </label>
      )}

      {/* Flash */}
      {flash && (
        <div style={{
          padding: '6px 10px', borderRadius: 7, flexShrink: 0,
          background: flash.mode === 'heal' ? 'rgba(74,222,128,0.12)' : 'var(--c-danger-dim)',
          color: flash.mode === 'heal' ? 'var(--c-success)' : 'var(--c-danger)',
          fontSize: '0.82rem', fontWeight: 600, textAlign: 'center',
        }}>
          {flash.mode === 'heal' ? 'Healed' : 'Dealt'} {flash.amount}
          {flash.halved ? ' (halved)' : ''} to {flash.count} combatant{flash.count === 1 ? '' : 's'}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex" style={{ gap: 'var(--sp-1)', flexShrink: 0 }}>
        <button
          onClick={() => selectAll(allies)}
          className="btn-ghost"
          disabled={allies.length === 0}
          style={{ flex: 1, minHeight: 32, minWidth: 'unset', fontSize: '0.78rem', padding: '0 8px', justifyContent: 'center' }}
        >All Allies</button>
        <button
          onClick={() => selectAll(enemies)}
          className="btn-ghost"
          disabled={enemies.length === 0}
          style={{ flex: 1, minHeight: 32, minWidth: 'unset', fontSize: '0.78rem', padding: '0 8px', justifyContent: 'center' }}
        >All Enemies</button>
        <button
          onClick={clear}
          className="btn-ghost"
          disabled={selectedCount === 0}
          style={{ minHeight: 32, minWidth: 'unset', fontSize: '0.78rem', padding: '0 12px', justifyContent: 'center' }}
        >Clear</button>
      </div>

      <hr className="divider flex-shrink-0" />

      {/* List */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        {combatants.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 'var(--sp-4) 0' }}>
            No combatants in the encounter yet.
          </p>
        )}

        {allies.length > 0 && (
          <>
            <div className="label">Allies</div>
            <div className="flex flex-col" style={{ gap: 'var(--sp-1)' }}>
              {allies.map(c => (
                <CombatantRow
                  key={c.id}
                  c={c}
                  selected={selectedIds.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </div>
          </>
        )}

        {enemies.length > 0 && (
          <>
            <div className="label">Enemies</div>
            <div className="flex flex-col" style={{ gap: 'var(--sp-1)' }}>
              {enemies.map(c => (
                <CombatantRow
                  key={c.id}
                  c={c}
                  selected={selectedIds.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
