import { useState, useRef, useEffect } from 'react'
import { useEncounterStore } from '../../store/encounterStore'

function InitInput({ id, value, onCommit, style }) {
  const [draft, setDraft] = useState(null)
  const commit = () => {
    if (draft !== null) {
      if (draft !== '') {
        const n = parseInt(draft, 10)
        if (!isNaN(n)) onCommit(id, n)
      }
      setDraft(null)
    }
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft !== null ? draft : String(value)}
      onFocus={e => { setDraft(String(value)); e.target.select() }}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit() }}
      onClick={e => e.stopPropagation()}
      style={style}
      title="Initiative roll"
    />
  )
}

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const abilityMod = score => { const m = Math.floor((score - 10) / 2); return m >= 0 ? `+${m}` : `${m}` }

function CombatantRow({ c, idx, isActive, isSelected, isManual, isLast, wide, onSelect, onMoveUp, onMoveDown }) {
  const [amt, setAmt] = useState('')
  const { setInitiativeRoll, updateHP } = useEncounterStore()

  const total = isManual ? c.initiative.roll : c.initiative.roll + c.initiative.bonus
  const isDowned = c.hp.current === 0
  const hpPct = c.hp.max > 0 ? c.hp.current / c.hp.max : 0
  const barColor = hpPct > 0.5 ? 'var(--c-success)' : hpPct > 0.25 ? 'var(--c-accent)' : 'var(--c-danger)'

  const applyHP = (dir) => {
    const n = parseInt(amt, 10)
    if (isNaN(n) || n <= 0) return
    updateHP(c.id, dir === 'heal' ? n : -n)
    setAmt('')
  }

  return (
    <div
      onClick={() => onSelect(c.id)}
      style={{
        borderRadius: 8, cursor: 'pointer', padding: '6px 8px',
        background: isActive ? 'var(--c-accent-dim)' : isSelected ? 'var(--c-elevated)' : 'transparent',
        border: isActive ? '1px solid var(--c-accent)' : isDowned ? '1px solid var(--c-danger)' : '1px solid transparent',
        opacity: isDowned ? 0.7 : 1,
        transition: 'background 0.1s',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}
    >
      {/* Top row: position | roll | name + badges | AC | total | reorder */}
      <div className="flex items-center" style={{ gap: 6 }}>
        <span style={{ width: 16, textAlign: 'center', fontSize: '0.65rem', color: isActive ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 700, flexShrink: 0 }}>
          {isActive ? '▶' : idx + 1}
        </span>

        <InitInput
          id={c.id}
          value={c.initiative.roll}
          onCommit={setInitiativeRoll}
          style={{ width: 34, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', minHeight: 28, padding: '2px 4px' }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name}
            </span>
            {isDowned && (
              <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--c-danger)', background: 'var(--c-danger-dim)', borderRadius: 4, padding: '1px 4px', flexShrink: 0, letterSpacing: '0.03em' }}>
                DOWN
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--c-muted)', marginTop: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: c.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)' }}>●</span>
            <span>AC {c.ac}</span>
            {!isManual && c.initiative.bonus !== 0 && (
              <span>{c.initiative.bonus > 0 ? '+' : ''}{c.initiative.bonus} bonus</span>
            )}
            {c.conditions?.length > 0 && (
              <span style={{ color: 'var(--c-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.conditions.join(', ')}
              </span>
            )}
          </div>
        </div>

        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isActive ? 'var(--c-accent)' : 'var(--c-text)', minWidth: 18, textAlign: 'right', flexShrink: 0 }}>
          {total}
        </span>

        <div className="flex flex-col" style={{ gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={idx === 0}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 'unset', minWidth: 'unset', padding: '1px 4px', fontSize: '0.6rem', lineHeight: 1, opacity: idx === 0 ? 0.2 : 0.6 }}
          >▲</button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 'unset', minWidth: 'unset', padding: '1px 4px', fontSize: '0.6rem', lineHeight: 1, opacity: isLast ? 0.2 : 0.6 }}
          >▼</button>
        </div>
      </div>

      {/* HP bar + quick DMG/HEAL */}
      <div style={{ paddingLeft: 22 }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, borderRadius: 2, background: 'var(--c-elevated)', overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: `${hpPct * 100}%`, background: barColor, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', minWidth: 32 }}>{c.hp.current}/{c.hp.max}</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="±"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyHP('dmg') }}
            style={{ width: 38, minHeight: 22, padding: '0 4px', fontSize: '0.72rem', textAlign: 'center' }}
          />
          <button
            onClick={() => applyHP('dmg')}
            style={{ background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)', borderRadius: 5, padding: '0 6px', minHeight: 22, minWidth: 'unset', fontSize: '0.65rem', fontWeight: 600 }}
          >DMG</button>
          <button
            onClick={() => applyHP('heal')}
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid var(--c-success)', color: 'var(--c-success)', borderRadius: 5, padding: '0 6px', minHeight: 22, minWidth: 'unset', fontSize: '0.65rem', fontWeight: 600 }}
          >HEAL</button>
        </div>
      </div>

      {/* Ability scores — only when panel is wide enough */}
      {wide && (
        <div style={{ paddingLeft: 22, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }} onClick={e => e.stopPropagation()}>
          {ABILITIES.map(a => {
            const score = c.abilities?.[a] ?? 10
            return (
              <div key={a} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--c-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{a}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.2 }}>{score}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--c-muted)' }}>{abilityMod(score)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function InitiativeTracker() {
  const {
    encounter,
    nextTurn, prevTurn,
    sortInitiative, setInitiativeRoll, setInitiativeMode,
    selectCombatant, selectedCombatantId,
    addToInitiative, reorderInitiative,
  } = useEncounterStore()

  const { initiativeOrder, combatants, currentTurnIndex, round, initiativeMode = 'auto' } = encounter
  const isManual = initiativeMode === 'manual'

  const containerRef = useRef(null)
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 380))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ordered = initiativeOrder
    .map(id => combatants.find(c => c.id === id))
    .filter(Boolean)

  const unordered = combatants.filter(c => !initiativeOrder.includes(c.id))
  const currentId = initiativeOrder[currentTurnIndex]

  const moveUp = (idx) => {
    if (idx === 0) return
    const next = [...initiativeOrder]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    reorderInitiative(next)
  }

  const moveDown = (idx) => {
    if (idx === initiativeOrder.length - 1) return
    const next = [...initiativeOrder]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    reorderInitiative(next)
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 8 }}>
      {/* Round row */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ gap: 8 }}>
        <div>
          <div className="label">Round</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-accent)', lineHeight: 1 }}>{round}</div>
        </div>
        <div className="flex" style={{ gap: 5 }}>
          <button
            onClick={prevTurn}
            className="btn-ghost"
            style={{ minHeight: 38, minWidth: 38, padding: 0, justifyContent: 'center', fontSize: '0.8rem' }}
            disabled={initiativeOrder.length === 0}
          >◀</button>
          <button
            onClick={nextTurn}
            className="btn-primary"
            style={{ minHeight: 38, minWidth: 'unset', padding: '0 14px', fontSize: '0.8rem' }}
            disabled={initiativeOrder.length === 0}
          >Next ▶</button>
        </div>
      </div>

      {/* Mode toggle + Sort */}
      <div className="flex flex-shrink-0" style={{ gap: 6 }}>
        <div style={{ display: 'flex', border: '1px solid var(--c-border)', borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
          {['auto', 'manual'].map(m => (
            <button
              key={m}
              onClick={() => setInitiativeMode(m)}
              style={{
                minHeight: 32, minWidth: 'unset', padding: '0 10px', fontSize: '0.72rem', fontWeight: 600,
                borderRadius: 0, border: 'none',
                background: initiativeMode === m ? 'var(--c-accent-dim)' : 'transparent',
                color: initiativeMode === m ? 'var(--c-accent)' : 'var(--c-muted)',
                textTransform: 'capitalize',
              }}
            >{m}</button>
          ))}
        </div>
        <button
          onClick={sortInitiative}
          className="btn-ghost"
          style={{ flex: 1, minHeight: 32, minWidth: 'unset', justifyContent: 'center', fontSize: '0.78rem' }}
          disabled={combatants.length === 0}
        >Sort by Initiative</button>
      </div>

      <hr className="divider flex-shrink-0" />

      {/* List */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ordered.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>
            Add combatants, set rolls, then sort.
          </p>
        )}

        {ordered.map((c, idx) => (
          <CombatantRow
            key={c.id}
            c={c}
            idx={idx}
            isActive={c.id === currentId}
            isSelected={c.id === selectedCombatantId}
            isManual={isManual}
            isLast={idx === ordered.length - 1}
            wide={wide}
            onSelect={selectCombatant}
            onMoveUp={() => moveUp(idx)}
            onMoveDown={() => moveDown(idx)}
          />
        ))}

        {unordered.length > 0 && (
          <>
            <div style={{ color: 'var(--c-muted)', fontSize: '0.68rem', padding: '4px 4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Not in initiative</div>
            {unordered.map(c => (
              <div
                key={c.id}
                onClick={() => selectCombatant(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                  opacity: 0.45, minHeight: 46,
                  border: '1px solid transparent',
                }}
              >
                <InitInput
                  id={c.id}
                  value={c.initiative.roll}
                  onCommit={setInitiativeRoll}
                  style={{ width: 38, textAlign: 'center', fontSize: '0.82rem', minHeight: 32, padding: '2px 4px' }}
                />
                <span style={{ flex: 1, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); addToInitiative(c.id) }}
                  className="btn-ghost"
                  style={{ minHeight: 30, minWidth: 30, padding: 0, fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Add to initiative"
                >+</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
