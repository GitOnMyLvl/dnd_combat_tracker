import { useState, useRef, useEffect } from 'react'
import { useEncounterStore } from '../../store/encounterStore'
import HPEditor from '../shared/HPEditor'
import EditableField from '../shared/EditableField'
import ConditionBadge from '../shared/ConditionBadge'
import MonsterSearch from '../shared/MonsterSearch'
import CharacterFormModal from '../shared/CharacterFormModal'
import Modal from '../shared/Modal'
import { useCharacterStore, combatantToTemplate, templateToCombatant, DEFAULT_ABILITIES } from '../../store/characterStore'
import { CONDITION_NAMES } from '../../constants/conditions'
import { ABILITY_LABELS, abilityModifier, formatModifier } from '../../utils/abilities'
import { getHpStatus } from '../../utils/hpStatus'

function AddManualModal({ tableType, onClose }) {
  const addCombatant = useEncounterStore(s => s.addCombatant)

  return (
    <CharacterFormModal
      title={`Add ${tableType === 'ally' ? 'Ally' : 'Enemy'}`}
      lockedType={tableType}
      onClose={onClose}
      onSave={(data) => addCombatant(templateToCombatant(data))}
    />
  )
}

function MonsterSearchModal({ onClose }) {
  return (
    <Modal title="Search Monster (Open5e)" onClose={onClose} inline>
      <MonsterSearch onClose={onClose} />
    </Modal>
  )
}

function StatPill({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span className="label">{label}</span>
      <EditableField
        value={value}
        type="number"
        placeholder="—"
        onChange={onChange}
        className="font-bold text-center"
        style={{ fontSize: '1.0rem' }}
      />
    </div>
  )
}

function CombatantRow({ combatant, isSelected, isActive, rowRef: scrollRef }) {
  const { updateCombatant, removeCombatant, toggleCondition, selectCombatant, resetCombatantToApi, setExhaustion, toggleInspiration } = useEncounterStore()
  const saveCharacter = useCharacterStore(s => s.saveCharacter)
  const [expanded, setExpanded] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const rowRef = useRef(null)
  const [rowWidth, setRowWidth] = useState(0)

  useEffect(() => {
    if (!rowRef.current) return
    const ro = new ResizeObserver(entries => setRowWidth(entries[0].contentRect.width))
    ro.observe(rowRef.current)
    return () => ro.disconnect()
  }, [])

  const { color: hpColor } = getHpStatus(combatant.hp)
  const exhaustion = combatant.exhaustion ?? 0
  const inspiration = combatant.inspiration ?? false

  return (
    <div
      ref={el => { rowRef.current = el; scrollRef?.(el) }}
      style={{
        borderRadius: 10,
        border: isActive ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
        background: isActive ? 'var(--c-accent-dim)' : isSelected ? 'var(--c-elevated)' : 'var(--c-surface)',
        transition: 'border-color 0.15s, background 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Summary row — entire row is clickable */}
      <div
        className="flex items-center"
        style={{ gap: 8, padding: '8px 10px', minHeight: 52, cursor: 'pointer' }}
        onClick={() => { selectCombatant(combatant.id); setExpanded(v => !v) }}
      >
        {/* Type dot */}
        <span style={{ color: combatant.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.65rem', flexShrink: 0 }}>●</span>

        {/* Name + conditions — plain display, no stopPropagation */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            className="font-semibold"
            style={{ fontSize: '0.95rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {combatant.name || <span style={{ opacity: 0.4 }}>—</span>}
          </span>
          {rowWidth >= 200 && (combatant.conditions.length > 0 || exhaustion > 0 || inspiration) && (
            <div className="flex flex-wrap" style={{ gap: 3, marginTop: 3 }} onClick={e => e.stopPropagation()}>
              {inspiration && (
                <span style={{ background: '#1d4ed833', border: '1px solid #1d4ed888', borderRadius: 100, padding: '1px 7px', fontSize: '0.78rem', fontWeight: 600, color: '#e8e8e8' }}>
                  ✦ Inspired
                </span>
              )}
              {exhaustion > 0 && (
                <span style={{ background: '#78350f33', border: '1px solid #78350f88', borderRadius: 100, padding: '1px 7px', fontSize: '0.78rem', fontWeight: 600, color: '#e8e8e8' }}>
                  Exhaustion {exhaustion} (−{exhaustion * 2})
                </span>
              )}
              {combatant.conditions.map(cond => (
                <ConditionBadge
                  key={cond}
                  condition={cond}
                  onRemove={e => { e?.stopPropagation?.(); toggleCondition(combatant.id, cond) }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats: AC (when wide enough) + saves (when wide) + HP */}
        <div className="flex items-center" style={{ gap: 10, flexShrink: 0 }}>
          {/* AC — hidden when too narrow */}
          {rowWidth >= 260 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
              <span className="label">AC</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', textAlign: 'center' }}>{combatant.ac ?? '—'}</span>
            </div>
          )}

          {/* Saving throw modifiers — visible when card is wide enough */}
          {rowWidth > 440 && (() => {
            const abilities = combatant.abilities ?? DEFAULT_ABILITIES
            return ABILITY_LABELS.map(a => {
              const score = abilities[a] ?? 10
              return (
                <div key={a} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                  <span className="label">{a.toUpperCase()}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{formatModifier(score)}</span>
                </div>
              )
            })
          })()}

          {/* HP — always rightmost */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
            <span className="label">HP</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: hpColor, whiteSpace: 'nowrap' }}>
              {combatant.hp.current}<span style={{ color: 'var(--c-muted)', fontWeight: 400 }}>/{combatant.hp.max}</span>
            </span>
          </div>
        </div>

        <span style={{ color: 'var(--c-muted)', fontSize: '0.75rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div
          style={{ borderTop: '1px solid var(--c-border)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Name + AC editing */}
          <div className="flex items-center" style={{ gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="label" style={{ marginBottom: 3 }}>Name</div>
              <EditableField
                value={combatant.name}
                onChange={v => updateCombatant(combatant.id, { name: v })}
                className="font-semibold"
                style={{ fontSize: '0.95rem' }}
              />
            </div>
            <div style={{ flexShrink: 0 }}>
              <div className="label" style={{ marginBottom: 3 }}>AC</div>
              <EditableField
                value={combatant.ac}
                type="number"
                onChange={v => updateCombatant(combatant.id, { ac: v })}
                style={{ fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', width: 52 }}
              />
            </div>
          </div>

          <HPEditor combatant={combatant} />

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '8px 0', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
            <StatPill
              label="Spell DC"
              value={combatant.spellSaveDC ?? ''}
              onChange={v => updateCombatant(combatant.id, { spellSaveDC: v ?? null })}
            />
            <StatPill
              label="Spell Atk"
              value={combatant.spellAttackBonus ?? ''}
              onChange={v => updateCombatant(combatant.id, { spellAttackBonus: v ?? null })}
            />
            <StatPill
              label="Init Bonus"
              value={combatant.initiative.bonus}
              onChange={v => updateCombatant(combatant.id, { initiative: { ...combatant.initiative, bonus: v } })}
            />
          </div>

          {/* Exhaustion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="label" style={{ minWidth: 70 }}>Exhaustion</span>
            <button
              onClick={() => setExhaustion(combatant.id, exhaustion - 1)}
              disabled={exhaustion === 0}
              style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, minHeight: 36, minWidth: 44, padding: 0, fontSize: '1rem', color: 'var(--c-muted)' }}
            >−</button>
            <span style={{ fontWeight: 700, fontSize: '1.0rem', minWidth: 16, textAlign: 'center', color: exhaustion > 0 ? '#f97316' : 'var(--c-muted)' }}>
              {exhaustion}
            </span>
            <button
              onClick={() => setExhaustion(combatant.id, exhaustion + 1)}
              disabled={exhaustion === 10}
              style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, minHeight: 36, minWidth: 44, padding: 0, fontSize: '1rem', color: 'var(--c-muted)' }}
            >+</button>
            {exhaustion > 0 && (
              <span style={{ fontSize: '0.82rem', color: '#f97316', marginLeft: 4 }}>
                −{exhaustion * 2} to d20s{exhaustion >= 5 ? ' · speed halved' : ''}
              </span>
            )}
          </div>

          {/* Ability Scores */}
          {(() => {
            const abilities = combatant.abilities ?? DEFAULT_ABILITIES
            return (
              <div style={{ display: 'grid', gridTemplateColumns: rowWidth < 260 ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 6 }}>
                {ABILITY_LABELS.map(a => {
                  const score = abilities[a] ?? 10
                  return (
                    <StatPill
                      key={a}
                      label={<>{a.toUpperCase()} <span style={{ fontWeight: 400, opacity: 0.6 }}>{formatModifier(score)}</span></>}
                      value={score}
                      onChange={v => updateCombatant(combatant.id, { abilities: { ...abilities, [a]: v } })}
                    />
                  )
                })}
              </div>
            )
          })()}

          {/* Conditions */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Conditions</div>
            <div className="flex flex-wrap" style={{ gap: 4 }}>
              {CONDITION_NAMES.map(cond => {
                const active = combatant.conditions.includes(cond)
                return (
                  <button
                    key={cond}
                    onClick={() => toggleCondition(combatant.id, cond)}
                    style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600,
                      minHeight: 36, minWidth: 'unset',
                      border: active ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
                      background: active ? 'var(--c-accent-dim)' : 'transparent',
                      color: active ? 'var(--c-accent)' : 'var(--c-muted2)',
                      transition: 'all 0.1s',
                    }}
                  >{cond}</button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes…"
            value={combatant.notes}
            onChange={e => updateCombatant(combatant.id, { notes: e.target.value })}
            rows={2}
            style={{ width: '100%', resize: 'none', fontSize: '0.9rem', minHeight: 56 }}
          />

          {/* Actions */}
          <div className="flex justify-end" style={{ gap: 6 }}>
            <button
              onClick={() => toggleInspiration(combatant.id)}
              className="btn-ghost"
              style={{
                minHeight: 36, minWidth: 'unset', fontSize: '0.85rem',
                color: inspiration ? '#60a5fa' : undefined,
                border: inspiration ? '1px solid #1d4ed888' : undefined,
                background: inspiration ? '#1d4ed822' : undefined,
              }}
            >
              ✦ {inspiration ? 'Inspired' : 'Inspire'}
            </button>
            <button
              onClick={() => {
                saveCharacter(combatantToTemplate(combatant))
                setSaveFlash(true)
                setTimeout(() => setSaveFlash(false), 1200)
              }}
              className="btn-ghost"
              style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.85rem', color: saveFlash ? 'var(--c-success)' : undefined }}
            >
              {saveFlash ? 'Saved!' : 'Save'}
            </button>
            {combatant._source === 'api' && combatant._apiData && (
              <button onClick={() => resetCombatantToApi(combatant.id)} className="btn-ghost" style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.85rem' }}>
                Reset to Default
              </button>
            )}
            {!confirmRemove ? (
              <button
                onClick={() => setConfirmRemove(true)}
                className="btn-danger"
                style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.85rem' }}
              >Remove</button>
            ) : (
              <div className="flex" style={{ gap: 4 }}>
                <button
                  onClick={() => removeCombatant(combatant.id)}
                  style={{
                    background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)',
                    minHeight: 36, minWidth: 'unset', padding: '0 12px', fontSize: '0.85rem', fontWeight: 700,
                    cursor: 'pointer', borderRadius: 6,
                  }}
                >Yes</button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  style={{
                    background: 'none', border: '1px solid var(--c-border)', color: 'var(--c-muted)',
                    minHeight: 36, minWidth: 'unset', padding: '0 12px', fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', borderRadius: 6,
                  }}
                >No</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CombatantTable({ config = {} }) {
  const { tableType = 'enemy' } = config
  const { encounter, selectedCombatantId } = useEncounterStore()
  const [showManual, setShowManual] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const rowRefs = useRef({})

  const combatants = encounter.combatants.filter(c => c.type === tableType && !c._token)
  const currentId = encounter.initiativeOrder[encounter.currentTurnIndex]

  // Auto-scroll to active combatant on turn change
  useEffect(() => {
    if (currentId && rowRefs.current[currentId]) {
      rowRefs.current[currentId].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 'var(--sp-2)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span style={{ color: 'var(--c-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          {combatants.length} {combatants.length === 1 ? 'combatant' : 'combatants'}
        </span>
        <div className="flex" style={{ gap: 5 }}>
          {tableType === 'enemy' && (
            <button onClick={() => setShowSearch(true)} className="btn-ghost" style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.85rem' }}>
              + Monster
            </button>
          )}
          <button onClick={() => setShowManual(true)} className="btn-primary" style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.85rem' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        {combatants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--c-muted)', fontSize: '0.9rem' }}>
            No {tableType === 'ally' ? 'allies' : 'enemies'} yet.
            <br />
            <span style={{ color: 'var(--c-muted)', fontSize: '0.82rem' }}>
              {tableType === 'enemy' ? 'Add manually or search a monster.' : 'Add your party members.'}
            </span>
          </div>
        )}
        {combatants.map(c => (
          <CombatantRow
            key={c.id}
            combatant={c}
            isSelected={c.id === selectedCombatantId}
            isActive={c.id === currentId}
            rowRef={el => { rowRefs.current[c.id] = el }}
          />
        ))}
      </div>

      {showManual && <AddManualModal tableType={tableType} onClose={() => setShowManual(false)} />}
      {showSearch && <MonsterSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}
