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

const ABILITY_LABELS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

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
    <Modal title="Search Monster (Open5e)" onClose={onClose}>
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
        style={{ fontSize: '0.9rem' }}
      />
    </div>
  )
}

function CombatantRow({ combatant, isSelected, isActive }) {
  const { updateCombatant, removeCombatant, toggleCondition, selectCombatant, resetCombatantToApi, setExhaustion, toggleInspiration } = useEncounterStore()
  const saveCharacter = useCharacterStore(s => s.saveCharacter)
  const [expanded, setExpanded] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const rowRef = useRef(null)
  const [rowWidth, setRowWidth] = useState(0)

  useEffect(() => {
    if (!rowRef.current) return
    const ro = new ResizeObserver(entries => setRowWidth(entries[0].contentRect.width))
    ro.observe(rowRef.current)
    return () => ro.disconnect()
  }, [])

  const dying = combatant.hp.current === 0
  const bloodied = !dying && combatant.hp.current <= Math.floor(combatant.hp.max / 2)
  const exhaustion = combatant.exhaustion ?? 0
  const inspiration = combatant.inspiration ?? false

  return (
    <div
      ref={rowRef}
      style={{
        borderRadius: 10,
        border: isActive ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
        background: isActive ? 'var(--c-accent-dim)' : isSelected ? 'var(--c-elevated)' : 'var(--c-surface)',
        transition: 'border-color 0.15s, background 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Summary row */}
      <div
        className="flex items-center"
        style={{ gap: 8, padding: '8px 10px', minHeight: 52, cursor: 'pointer' }}
        onClick={() => { selectCombatant(combatant.id); setExpanded(v => !v) }}
      >
        {/* Type dot */}
        <span style={{ color: combatant.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.55rem', flexShrink: 0 }}>●</span>

        {/* Name + conditions */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
          <EditableField
            value={combatant.name}
            onChange={v => updateCombatant(combatant.id, { name: v })}
            className="font-semibold"
            style={{ fontSize: '0.85rem' }}
          />
          {(combatant.conditions.length > 0 || exhaustion > 0 || inspiration) && (
            <div className="flex flex-wrap" style={{ gap: 3, marginTop: 3 }}>
              {inspiration && (
                <span style={{ background: '#1d4ed833', border: '1px solid #1d4ed888', borderRadius: 100, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 600, color: '#e8e8e8' }}>
                  ✦ Inspired
                </span>
              )}
              {exhaustion > 0 && (
                <span style={{ background: '#78350f33', border: '1px solid #78350f88', borderRadius: 100, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 600, color: '#e8e8e8' }}>
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

        {/* Stats: AC + saves (when wide) + HP */}
        <div className="flex items-center" style={{ gap: 10, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {/* AC */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
            <span className="label">AC</span>
            <EditableField
              value={combatant.ac}
              type="number"
              onChange={v => updateCombatant(combatant.id, { ac: v })}
              style={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', width: 28, minHeight: 'unset' }}
            />
          </div>

          {/* Saving throw modifiers — visible when card is wide enough */}
          {rowWidth > 440 && (() => {
            const abilities = combatant.abilities ?? DEFAULT_ABILITIES
            return ABILITY_LABELS.map(a => {
              const score = abilities[a] ?? 10
              const mod = Math.floor((score - 10) / 2)
              return (
                <div key={a} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                  <span className="label">{a.toUpperCase()}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{mod >= 0 ? `+${mod}` : mod}</span>
                </div>
              )
            })
          })()}

          {/* HP — always rightmost */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
            <span className="label">HP</span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: dying ? 'var(--c-danger)' : bloodied ? '#f97316' : 'var(--c-text)', whiteSpace: 'nowrap' }}>
              {combatant.hp.current}<span style={{ color: 'var(--c-muted)', fontWeight: 400 }}>/{combatant.hp.max}</span>
            </span>
          </div>
        </div>

        <span style={{ color: 'var(--c-muted)', fontSize: '0.65rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div
          style={{ borderTop: '1px solid var(--c-border)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}
          onClick={e => e.stopPropagation()}
        >
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
              style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, minHeight: 26, minWidth: 26, padding: 0, fontSize: '0.9rem', color: 'var(--c-muted)' }}
            >−</button>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 16, textAlign: 'center', color: exhaustion > 0 ? '#f97316' : 'var(--c-muted)' }}>
              {exhaustion}
            </span>
            <button
              onClick={() => setExhaustion(combatant.id, exhaustion + 1)}
              disabled={exhaustion === 10}
              style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, minHeight: 26, minWidth: 26, padding: 0, fontSize: '0.9rem', color: 'var(--c-muted)' }}
            >+</button>
            {exhaustion > 0 && (
              <span style={{ fontSize: '0.72rem', color: '#f97316', marginLeft: 4 }}>
                −{exhaustion * 2} to d20s{exhaustion >= 5 ? ' · speed halved' : ''}
              </span>
            )}
          </div>

          {/* Ability Scores */}
          {(() => {
            const abilities = combatant.abilities ?? DEFAULT_ABILITIES
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                {ABILITY_LABELS.map(a => {
                  const score = abilities[a] ?? 10
                  const m = Math.floor((score - 10) / 2)
                  return (
                    <StatPill
                      key={a}
                      label={<>{a.toUpperCase()} <span style={{ fontWeight: 400, opacity: 0.6 }}>{m >= 0 ? `+${m}` : m}</span></>}
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
                      padding: '3px 8px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600,
                      minHeight: 'unset', minWidth: 'unset',
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
            style={{ width: '100%', resize: 'none', fontSize: '0.8rem', minHeight: 56 }}
          />

          {/* Actions */}
          <div className="flex justify-end" style={{ gap: 6 }}>
            <button
              onClick={() => toggleInspiration(combatant.id)}
              className="btn-ghost"
              style={{
                minHeight: 32, minWidth: 'unset', fontSize: '0.75rem',
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
              style={{ minHeight: 32, minWidth: 'unset', fontSize: '0.75rem', color: saveFlash ? 'var(--c-success)' : undefined }}
            >
              {saveFlash ? 'Saved!' : 'Save'}
            </button>
            {combatant._source === 'api' && combatant._apiData && (
              <button onClick={() => resetCombatantToApi(combatant.id)} className="btn-ghost" style={{ minHeight: 32, minWidth: 'unset', fontSize: '0.75rem' }}>
                Reset to Default
              </button>
            )}
            <button onClick={() => removeCombatant(combatant.id)} className="btn-danger" style={{ minHeight: 32, minWidth: 'unset', fontSize: '0.75rem' }}>
              Remove
            </button>
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

  const combatants = encounter.combatants.filter(c => c.type === tableType)
  const currentId = encounter.initiativeOrder[encounter.currentTurnIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 8 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <span style={{ color: 'var(--c-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
          {combatants.length} {combatants.length === 1 ? 'combatant' : 'combatants'}
        </span>
        <div className="flex" style={{ gap: 5 }}>
          {tableType === 'enemy' && (
            <button onClick={() => setShowSearch(true)} className="btn-ghost" style={{ minHeight: 32, minWidth: 'unset', fontSize: '0.75rem' }}>
              + Monster
            </button>
          )}
          <button onClick={() => setShowManual(true)} className="btn-primary" style={{ minHeight: 32, minWidth: 'unset', fontSize: '0.75rem' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {combatants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--c-muted)', fontSize: '0.8rem' }}>
            No {tableType === 'ally' ? 'allies' : 'enemies'} yet.
            <br />
            <span style={{ color: 'var(--c-muted)', fontSize: '0.72rem' }}>
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
          />
        ))}
      </div>

      {showManual && <AddManualModal tableType={tableType} onClose={() => setShowManual(false)} />}
      {showSearch && <MonsterSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}
