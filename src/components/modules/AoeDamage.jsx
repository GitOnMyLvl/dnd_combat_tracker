import { Fragment, useState, useMemo } from 'react'
import { useEncounterStore } from '../../store/encounterStore'
import { getHpStatus } from '../../utils/hpStatus'

function bucketizeMods(selectedIds, savedIds, resistIds) {
  let full = 0, half = 0, quarter = 0
  selectedIds.forEach(id => {
    const s = savedIds.has(id), r = resistIds.has(id)
    if (s && r) quarter++
    else if (s || r) half++
    else full++
  })
  return { full, half, quarter }
}

export function computeApplied(rawAmount, mode, saved = false, resist = false) {
  const n = parseInt(rawAmount, 10)
  if (isNaN(n) || n <= 0) return 0
  if (mode === 'heal') return n
  let x = n
  if (saved)  x = Math.floor(x / 2)
  if (resist) x = Math.floor(x / 2)
  return x
}

function ModToggle({ label, active, onClick, ariaLabel }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      aria-label={ariaLabel}
      aria-pressed={active}
      style={{
        minHeight: 26, minWidth: 'unset', padding: '0 8px',
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
        borderRadius: 6,
        border: `1px solid ${active ? 'var(--c-accent)' : 'var(--c-border-strong)'}`,
        background: active ? 'var(--c-accent-soft)' : 'transparent',
        color: active ? 'var(--c-accent)' : 'var(--c-muted2)',
        flexShrink: 0,
        transition: 'all 0.1s',
      }}
    >{label}</button>
  )
}

function CombatantRow({ c, selected, saved, resist, showMods, onToggle, onToggleSave, onToggleResist }) {
  const { dying, color: hpColor } = getHpStatus(c.hp)
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        padding: '6px 10px', borderRadius: 8,
        border: selected ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
        background: selected ? 'var(--c-accent-dim)' : 'var(--c-elevated)',
        minHeight: 40,
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
      {showMods && selected && (
        <>
          <ModToggle
            label="SAVE"
            active={saved}
            onClick={onToggleSave}
            ariaLabel={`Saved: ${c.name}`}
          />
          <ModToggle
            label="RES"
            active={resist}
            onClick={onToggleResist}
            ariaLabel={`Resist: ${c.name}`}
          />
        </>
      )}
      <span style={{ fontSize: '0.78rem', color: hpColor, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {c.hp.current}<span style={{ color: 'var(--c-muted)' }}>/{c.hp.max}</span>
      </span>
    </div>
  )
}

export default function AoeDamage() {
  const combatants = useEncounterStore(s => s.encounter.combatants)
  const updateHP = useEncounterStore(s => s.updateHP)

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [savedIds, setSavedIds] = useState(() => new Set())
  const [resistIds, setResistIds] = useState(() => new Set())
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('damage')
  const [flash, setFlash] = useState(null)

  const allies  = useMemo(() => combatants.filter(c => c.type === 'ally'), [combatants])
  const enemies = useMemo(() => combatants.filter(c => c.type === 'enemy'), [combatants])

  const full = computeApplied(amount, mode, false, false)
  const selectedCount = selectedIds.size
  const canApply = full > 0 && selectedCount > 0

  const dropFromSet = (set, id) => {
    if (!set.has(id)) return set
    const next = new Set(set)
    next.delete(id)
    return next
  }

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setSavedIds(prev => dropFromSet(prev, id))
    setResistIds(prev => dropFromSet(prev, id))
  }

  const toggleIn = (setState) => (id) => {
    setState(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleSave   = toggleIn(setSavedIds)
  const toggleResist = toggleIn(setResistIds)

  const selectAll = (list) => setSelectedIds(prev => {
    const next = new Set(prev)
    list.forEach(c => next.add(c.id))
    return next
  })

  const clear = () => {
    setSelectedIds(new Set())
    setSavedIds(new Set())
    setResistIds(new Set())
  }

  const apply = () => {
    if (!canApply) return
    const isDamage = mode === 'damage'
    const buckets = isDamage
      ? bucketizeMods(selectedIds, savedIds, resistIds)
      : { full: selectedCount, half: 0, quarter: 0 }
    selectedIds.forEach(id => {
      const s = isDamage && savedIds.has(id)
      const r = isDamage && resistIds.has(id)
      const applied = computeApplied(amount, mode, s, r)
      updateHP(id, isDamage ? -applied : applied)
    })
    setFlash({
      mode,
      count: selectedCount,
      fullAmt:    computeApplied(amount, mode, false, false),
      halfAmt:    computeApplied(amount, mode, true,  false),
      quarterAmt: computeApplied(amount, mode, true,  true),
      buckets,
    })
    setAmount('')
    setSelectedIds(new Set())
    setSavedIds(new Set())
    setResistIds(new Set())
    setTimeout(() => setFlash(null), 2200)
  }

  const modeColor = mode === 'heal' ? 'var(--c-success)' : 'var(--c-danger)'

  const hintParts = []
  if (mode === 'damage' && amount && selectedCount > 0) {
    const { half, quarter } = bucketizeMods(selectedIds, savedIds, resistIds)
    if (half)    hintParts.push(`${half} × ${computeApplied(amount, mode, true, false)}`)
    if (quarter) hintParts.push(`${quarter} × ${computeApplied(amount, mode, true, true)} (¼)`)
  }

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
          {mode === 'heal' ? '+' : '−'}{full || 0}
        </button>
      </div>

      {/* Modifier hint */}
      {mode === 'damage' && selectedCount > 0 && amount && (
        <div
          style={{
            padding: '6px 10px', borderRadius: 7, flexShrink: 0,
            background: 'var(--c-elevated)',
            border: '1px solid var(--c-border)',
            color: 'var(--c-muted2)', fontSize: '0.76rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--sp-2)',
          }}
        >
          <span>
            Per-target: <strong style={{ color: 'var(--c-text)' }}>SAVE</strong> or <strong style={{ color: 'var(--c-text)' }}>RES</strong> halves · both stack to ¼.
          </span>
          {hintParts.length > 0 && (
            <span style={{ color: 'var(--c-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {hintParts.join(' · ')} HP
            </span>
          )}
        </div>
      )}

      {/* Flash */}
      {flash && (
        <div style={{
          padding: '6px 10px', borderRadius: 7, flexShrink: 0,
          background: flash.mode === 'heal' ? 'rgba(74,222,128,0.12)' : 'var(--c-danger-dim)',
          color: flash.mode === 'heal' ? 'var(--c-success)' : 'var(--c-danger)',
          fontSize: '0.82rem', fontWeight: 600, textAlign: 'center',
        }}>
          {(() => {
            if (flash.mode === 'heal') {
              return `Healed ${flash.fullAmt} HP · ${flash.count} target${flash.count === 1 ? '' : 's'}`
            }
            const parts = []
            if (flash.buckets.full)    parts.push(`${flash.buckets.full} × ${flash.fullAmt}`)
            if (flash.buckets.half)    parts.push(`${flash.buckets.half} × ${flash.halfAmt} (½)`)
            if (flash.buckets.quarter) parts.push(`${flash.buckets.quarter} × ${flash.quarterAmt} (¼)`)
            return `Dealt: ${parts.join(' · ')} HP`
          })()}
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

        {[
          { label: 'Allies',  list: allies },
          { label: 'Enemies', list: enemies },
        ].map(({ label, list }) => list.length > 0 && (
          <Fragment key={label}>
            <div className="label">{label}</div>
            <div className="flex flex-col" style={{ gap: 'var(--sp-1)' }}>
              {list.map(c => (
                <CombatantRow
                  key={c.id}
                  c={c}
                  selected={selectedIds.has(c.id)}
                  saved={savedIds.has(c.id)}
                  resist={resistIds.has(c.id)}
                  showMods={mode === 'damage'}
                  onToggle={() => toggle(c.id)}
                  onToggleSave={() => toggleSave(c.id)}
                  onToggleResist={() => toggleResist(c.id)}
                />
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
