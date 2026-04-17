import { useState, useRef, useEffect, useCallback } from 'react'
import { useEncounterStore } from '../../store/encounterStore'

const EMPTY_TOKEN = { name: '', init: '', init_mod: '', hp: '', ac: '', spell_dc: '', spell_atk: '', type: 'enemy' }

function NumField({ label, fieldKey, fields, set, onKey, placeholder = '—', style }) {
  const numStyle = { width: 44, minHeight: 36, textAlign: 'center', fontSize: '0.85rem', padding: '0 4px', ...style }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
      <input type="text" inputMode="numeric" placeholder={placeholder} value={fields[fieldKey]} onChange={e => set(fieldKey, e.target.value)} onKeyDown={onKey} style={numStyle} />
    </div>
  )
}

function AddTokenForm({ onAdd, onCancel }) {
  const [fields, setFields] = useState(EMPTY_TOKEN)
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const set = (k, v) => setFields(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const name = fields.name.trim() || 'Token'
    const hp = Math.max(1, parseInt(fields.hp, 10) || 1)
    const ac = parseInt(fields.ac, 10) || 10
    const init = parseInt(fields.init, 10) || 0
    const init_mod = parseInt(fields.init_mod, 10) || 0
    const spell_dc = fields.spell_dc !== '' ? (parseInt(fields.spell_dc, 10) || null) : null
    const spell_atk = fields.spell_atk !== '' ? (parseInt(fields.spell_atk, 10) || null) : null
    onAdd({ name, hp, ac, init, init_mod, spell_dc, spell_atk, type: fields.type })
  }

  const onKey = (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0', borderTop: '1px solid var(--c-border)' }}>
      {/* Name row */}
      <div className="flex items-center" style={{ gap: 5 }}>
        <button
          onClick={() => set('type', fields.type === 'enemy' ? 'ally' : 'enemy')}
          title={fields.type === 'enemy' ? 'Enemy — click to toggle' : 'Ally — click to toggle'}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: fields.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)',
            fontSize: '0.75rem', minHeight: 'unset', minWidth: 'unset', cursor: 'pointer', flexShrink: 0,
          }}
        >●</button>
        <input
          ref={nameRef}
          placeholder="Name"
          value={fields.name}
          onChange={e => set('name', e.target.value)}
          onKeyDown={onKey}
          style={{ flex: 1, minHeight: 36, fontSize: '0.9rem', padding: '0 8px' }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center" style={{ gap: 5 }}>
        <NumField label="Init" fieldKey="init" fields={fields} set={set} onKey={onKey} placeholder="0" />
        <NumField label="Init Mod" fieldKey="init_mod" fields={fields} set={set} onKey={onKey} placeholder="0" />
        <NumField label="HP" fieldKey="hp" fields={fields} set={set} onKey={onKey} placeholder="10" />
        <NumField label="AC" fieldKey="ac" fields={fields} set={set} onKey={onKey} placeholder="10" />
        <NumField label="Spell DC" fieldKey="spell_dc" fields={fields} set={set} onKey={onKey} />
        <NumField label="Spell Atk" fieldKey="spell_atk" fields={fields} set={set} onKey={onKey} />
        <div style={{ flex: 1 }} />
        <button
          onClick={submit}
          className="btn-primary"
          style={{ minHeight: 36, minWidth: 'unset', padding: '0 14px', fontSize: '0.85rem', flexShrink: 0 }}
        >Add</button>
        <button
          onClick={onCancel}
          className="btn-ghost"
          style={{ minHeight: 36, minWidth: 36, padding: 0, fontSize: '0.85rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Close"
        >✕</button>
      </div>
    </div>
  )
}

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


function DeathSaves({ combatant }) {
  const { setDeathSave, resetDeathSaves } = useEncounterStore()
  const { successes, failures } = combatant.deathSaves ?? { successes: 0, failures: 0 }

  const Pips = ({ count, max, color, type }) => (
    <div className="flex items-center" style={{ gap: 3 }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--c-muted)', minWidth: 10 }}>{type === 'successes' ? '✓' : '✗'}</span>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); setDeathSave(combatant.id, type, i < count ? i : i + 1) }}
          style={{
            width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
            background: i < count ? color : 'var(--c-elevated)',
            border: `1px solid ${i < count ? color : 'var(--c-border)'}`,
            transition: 'background 0.1s',
          }}
        />
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid var(--c-border)' }} onClick={e => e.stopPropagation()}>
      <span style={{ fontSize: '0.75rem', color: 'var(--c-danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>SAVES</span>
      <Pips count={successes} max={3} color="var(--c-success)" type="successes" />
      <Pips count={failures} max={3} color="var(--c-danger)" type="failures" />
      {(successes > 0 || failures > 0) && (
        <button
          onClick={() => resetDeathSaves(combatant.id)}
          style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.8rem', minHeight: 'unset', minWidth: 'unset', padding: '0 2px', cursor: 'pointer' }}
          title="Reset death saves"
        >↺</button>
      )}
      {failures >= 3 && <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--c-danger)' }}>DEAD</span>}
      {successes >= 3 && <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--c-success)' }}>STABLE</span>}
    </div>
  )
}

function CombatantRow({ c, idx, isActive, isSelected, isManual, isLast, onSelect, onMoveUp, onMoveDown, onRemove, rowRef }) {
  const [amt, setAmt] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { setInitiativeRoll, updateHP } = useEncounterStore()

  const total = isManual ? c.initiative.roll : c.initiative.roll + c.initiative.bonus
  const isDowned = c.hp.current === 0
  const hpPct = c.hp.max > 0 ? c.hp.current / c.hp.max : 0
  const barColor = hpPct > 0.5 ? 'var(--c-success)' : hpPct > 0.25 ? '#f97316' : 'var(--c-danger)'

  const applyHP = (dir) => {
    const n = parseInt(amt, 10)
    if (isNaN(n) || n <= 0) return
    updateHP(c.id, dir === 'heal' ? n : -n)
    setAmt('')
  }

  return (
    <div
      ref={rowRef}
      onClick={() => onSelect(isSelected ? null : c.id)}
      style={{
        borderRadius: 8, cursor: 'pointer', padding: '6px 8px',
        background: isActive ? 'var(--c-accent-dim)' : isSelected ? 'var(--c-elevated)' : 'transparent',
        border: isActive ? '1px solid var(--c-accent)' : '1px solid transparent',
        opacity: isDowned ? 0.7 : 1,
        transition: 'background 0.1s',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}
    >
      {/* Top row: position | roll | name + badges | AC | total | reorder */}
      <div className="flex items-center" style={{ gap: 6 }}>
        <span style={{ width: 16, textAlign: 'center', fontSize: '0.75rem', color: isActive ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 700, flexShrink: 0 }}>
          {isActive ? '▶' : idx + 1}
        </span>

        <InitInput
          id={c.id}
          value={c.initiative.roll}
          onCommit={setInitiativeRoll}
          style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: '0.92rem', minHeight: 36, padding: '2px 4px' }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 600, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name}
            </span>
            {isDowned && (
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--c-danger)', background: 'var(--c-danger-dim)', borderRadius: 4, padding: '1px 4px', flexShrink: 0, letterSpacing: '0.03em' }}>
                DOWN
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: c.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)' }}>●</span>
            <span>AC {c.ac}</span>
            {!isManual && c.initiative.bonus !== 0 && (
              <span>{c.initiative.bonus > 0 ? '+' : ''}{c.initiative.bonus} bonus</span>
            )}
            {c._token && c.spellSaveDC != null && <span>DC {c.spellSaveDC}</span>}
            {c._token && c.spellAttackBonus != null && (
              <span>Spell {c.spellAttackBonus >= 0 ? '+' : ''}{c.spellAttackBonus}</span>
            )}
            {c.conditions?.length > 0 && (
              <span style={{ color: 'var(--c-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.conditions.join(', ')}
              </span>
            )}
          </div>
        </div>

        {isManual && c.initiative.bonus !== 0 && (
          <span style={{ fontSize: '0.98rem', color: 'var(--c-muted)', flexShrink: 0 }} title="Initiative bonus">
            {c.initiative.bonus > 0 ? '+' : ''}{c.initiative.bonus}
          </span>
        )}

        <span style={{ fontWeight: 700, fontSize: '0.98rem', color: isActive ? 'var(--c-accent)' : 'var(--c-text)', minWidth: 18, textAlign: 'right', flexShrink: 0 }}>
          {total}
        </span>

        <div className="flex flex-col" style={{ gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={idx === 0}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 18, minWidth: 36, padding: '1px 4px', fontSize: '0.8rem', lineHeight: 1, opacity: idx === 0 ? 0.2 : 0.6 }}
          >▲</button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 18, minWidth: 36, padding: '1px 4px', fontSize: '0.8rem', lineHeight: 1, opacity: isLast ? 0.2 : 0.6 }}
          >▼</button>
        </div>

        {!confirmRemove ? (
          <button
            onClick={e => { e.stopPropagation(); setConfirmRemove(true) }}
            style={{
              background: 'none', border: '1px solid var(--c-border)', color: 'var(--c-muted)',
              minHeight: 36, minWidth: 'unset', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', flexShrink: 0, borderRadius: 5,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-danger)'; e.currentTarget.style.borderColor = 'var(--c-danger)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
          >Remove</button>
        ) : (
          <div className="flex" style={{ gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onRemove(c.id)}
              style={{
                background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)',
                minHeight: 36, minWidth: 'unset', padding: '0 8px', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer', borderRadius: 5,
              }}
            >Yes</button>
            <button
              onClick={() => setConfirmRemove(false)}
              style={{
                background: 'none', border: '1px solid var(--c-border)', color: 'var(--c-muted)',
                minHeight: 36, minWidth: 'unset', padding: '0 8px', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', borderRadius: 5,
              }}
            >No</button>
          </div>
        )}
      </div>

      {/* HP bar — always visible */}
      <div style={{ paddingLeft: 22 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center" style={{ gap: 6, marginBottom: isSelected ? 6 : 0 }}>
          <div style={{ flex: 1, height: 2, borderRadius: 2, background: 'var(--c-elevated)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${hpPct * 100}%`, background: barColor, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', flexShrink: 0 }}>{c.hp.current}/{c.hp.max}</span>
        </div>

        {/* HP controls — only when selected */}
        {isSelected && (
          <div className="flex items-center" style={{ gap: 4, flexWrap: 'wrap' }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="±"
              value={amt}
              onChange={e => setAmt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyHP('dmg') }}
              style={{ width: 44, minHeight: 36, padding: '0 4px', fontSize: '0.92rem', textAlign: 'center' }}
            />
            <button
              onClick={() => applyHP('dmg')}
              style={{ flex: 1, background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)', borderRadius: 5, padding: '0 8px', minHeight: 36, minWidth: 'unset', fontSize: '0.92rem', fontWeight: 600 }}
            >DMG</button>
            <button
              onClick={() => applyHP('heal')}
              style={{ flex: 1, background: 'rgba(74,222,128,0.1)', border: '1px solid var(--c-success)', color: 'var(--c-success)', borderRadius: 5, padding: '0 8px', minHeight: 36, minWidth: 'unset', fontSize: '0.92rem', fontWeight: 600 }}
            >HEAL</button>

          </div>
        )}

        {/* Death saves — only shown on that combatant's turn */}
        {isActive && isDowned && <DeathSaves combatant={c} />}
      </div>
    </div>
  )
}

export default function InitiativeTracker() {
  const {
    encounter,
    nextTurn, prevTurn,
    sortInitiative, setInitiativeRoll, setInitiativeMode,
    selectCombatant, selectedCombatantId,
    addCombatant, addToInitiative, reorderInitiative, removeFromInitiative,
  } = useEncounterStore()

  const { initiativeOrder, combatants, currentTurnIndex, round, initiativeMode = 'auto' } = encounter
  const isManual = initiativeMode === 'manual'
  const [showTokenForm, setShowTokenForm] = useState(false)
  const [tab, setTab] = useState('combat')

  const handleAddToken = useCallback(({ name, hp, ac, init, init_mod, spell_dc, spell_atk, type }) => {
    const id = addCombatant({
      name, type,
      hp: { current: hp, max: hp, temp: 0 },
      ac,
      initiative: { bonus: init_mod, roll: init },
      spellSaveDC: spell_dc,
      spellAttackBonus: spell_atk,
      _token: true,
    })
    addToInitiative(id)
    setShowTokenForm(false)
  }, [addCombatant, addToInitiative])

  const containerRef = useRef(null)
  const rowRefs = useRef({})

  // Auto-scroll to current combatant on turn change
  useEffect(() => {
    const id = initiativeOrder[currentTurnIndex]
    if (id && rowRefs.current[id]) {
      rowRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentTurnIndex, initiativeOrder])

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

  const tabStyle = (active) => ({
    flex: 1, minHeight: 36, minWidth: 'unset',
    fontSize: '0.85rem', fontWeight: 600, borderRadius: 6,
    background: active ? 'var(--c-accent-dim)' : 'transparent',
    color: active ? 'var(--c-accent)' : 'var(--c-muted)',
    border: active ? '1px solid var(--c-accent)' : '1px solid transparent',
    transition: 'all 0.12s',
  })

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 8 }}>
      {/* Tab bar */}
      <div className="flex flex-shrink-0" style={{ gap: 4 }}>
        <button style={tabStyle(tab === 'combat')} onClick={() => setTab('combat')}>In Combat</button>
        <button style={tabStyle(tab === 'standby')} onClick={() => setTab('standby')}>Out of Combat</button>
      </div>

      {tab === 'combat' && (
        <>
          {/* Round row */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ gap: 8 }}>
            <div>
              <div className="label">Round</div>
              <div data-testid="round-number" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-accent)', lineHeight: 1 }}>{round}</div>
            </div>
            <div className="flex" style={{ gap: 5 }}>
              <button
                onClick={prevTurn}
                className="btn-ghost"
                style={{ minHeight: 36, minWidth: 36, padding: 0, justifyContent: 'center', fontSize: '0.8rem' }}
                disabled={initiativeOrder.length === 0}
              >◀</button>
              <button
                onClick={nextTurn}
                className="btn-primary"
                style={{ minHeight: 36, minWidth: 'unset', padding: '0 16px', fontSize: '0.8rem' }}
                disabled={initiativeOrder.length === 0}
              >Next ▶</button>
            </div>
          </div>

          {/* Mode toggle + Sort + Add Token */}
          <div className="flex flex-shrink-0" style={{ gap: 6 }}>
            <div style={{ display: 'flex', border: '1px solid var(--c-border)', borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
              {['auto', 'manual'].map(m => (
                <button
                  key={m}
                  onClick={() => setInitiativeMode(m)}
                  style={{
                    minHeight: 36, minWidth: 'unset', padding: '0 12px', fontSize: '0.92rem', fontWeight: 600,
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
              style={{ flex: 1, minHeight: 36, minWidth: 'unset', justifyContent: 'center', fontSize: '0.98rem' }}
              disabled={initiativeOrder.length === 0}
            >Sort</button>
            <button
              onClick={() => setShowTokenForm(v => !v)}
              className={showTokenForm ? 'btn-ghost' : 'btn-primary'}
              style={{ minHeight: 36, minWidth: 'unset', padding: '0 12px', fontSize: '0.85rem', flexShrink: 0 }}
              title="Add a token directly to initiative"
            >+ Token</button>
          </div>

          {showTokenForm && (
            <AddTokenForm
              onAdd={handleAddToken}
              onCancel={() => setShowTokenForm(false)}
            />
          )}

          <hr className="divider flex-shrink-0" />

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
                onSelect={selectCombatant}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                onRemove={removeFromInitiative}
                rowRef={el => { rowRefs.current[c.id] = el }}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'standby' && (
        <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {unordered.length === 0 && (
            <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>
              No entities out of combat.
            </p>
          )}
          {unordered.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 8,
                minHeight: 46, border: '1px solid var(--c-border)',
                background: 'var(--c-surface)',
              }}
            >
              <span style={{ color: c.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.65rem', flexShrink: 0 }}>●</span>
              <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--c-muted)', flexShrink: 0 }}>AC {c.ac}</span>
              <InitInput
                id={c.id}
                value={c.initiative.roll}
                onCommit={setInitiativeRoll}
                style={{ width: 44, textAlign: 'center', fontSize: '0.92rem', minHeight: 36, padding: '2px 4px' }}
              />
              <button
                onClick={() => { addToInitiative(c.id); setTab('combat') }}
                className="btn-primary"
                style={{ minHeight: 36, minWidth: 'unset', padding: '0 10px', fontSize: '0.8rem', flexShrink: 0 }}
                title="Move to combat"
              >→ Combat</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
