import { useState } from 'react'
import { useEncounterStore } from '../../store/encounterStore'
import HPEditor from '../shared/HPEditor'
import EditableField from '../shared/EditableField'
import ConditionBadge from '../shared/ConditionBadge'
import MonsterSearch from '../shared/MonsterSearch'

const CONDITIONS = [
  'Blinded','Charmed','Deafened','Frightened','Grappled',
  'Incapacitated','Invisible','Paralyzed','Petrified',
  'Poisoned','Prone','Restrained','Stunned','Unconscious','Concentration',
]

function Modal({ onClose, title, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth: 380, padding: 20, boxShadow: '0 24px 64px var(--c-shadow)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AddManualModal({ tableType, onClose }) {
  const addCombatant = useEncounterStore(s => s.addCombatant)
  const [name, setName] = useState('')
  const [hp, setHp] = useState(10)
  const [ac, setAc] = useState(10)
  const [initBonus, setInitBonus] = useState(0)

  const submit = () => {
    if (!name.trim()) return
    addCombatant({
      name: name.trim(),
      type: tableType,
      hp: { current: hp, max: hp, temp: 0 },
      ac,
      initiative: { bonus: initBonus, roll: 0 },
    })
    onClose()
  }

  return (
    <Modal title={`Add ${tableType === 'ally' ? 'Ally' : 'Enemy'}`} onClose={onClose}>
      <div className="flex flex-col" style={{ gap: 10 }}>
        <input
          autoFocus
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ minHeight: 44, fontSize: '0.95rem' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Max HP', val: hp, set: v => setHp(parseInt(v,10)||1) },
            { label: 'AC', val: ac, set: v => setAc(parseInt(v,10)||1) },
            { label: 'Init Bonus', val: initBonus, set: v => setInitBonus(parseInt(v,10)||0) },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex flex-col" style={{ gap: 4 }}>
              <span className="label">{label}</span>
              <input type="number" value={val} onChange={e => set(e.target.value)} style={{ minHeight: 40, minWidth: 0, width: '100%', textAlign: 'center' }} />
            </label>
          ))}
        </div>
        <div className="flex justify-end" style={{ gap: 8, marginTop: 4 }}>
          <button onClick={onClose} className="btn-ghost" style={{ minHeight: 40, minWidth: 'unset' }}>Cancel</button>
          <button onClick={submit} className="btn-primary" style={{ minHeight: 40, minWidth: 'unset', padding: '0 20px' }}>Add</button>
        </div>
      </div>
    </Modal>
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
  const { updateCombatant, removeCombatant, toggleCondition, selectCombatant, resetCombatantToApi } = useEncounterStore()
  const [expanded, setExpanded] = useState(false)
  const dying = combatant.hp.current === 0

  return (
    <div
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
          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 3, marginTop: 3 }}>
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

        {/* AC */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <span className="label">AC</span>
          <EditableField
            value={combatant.ac}
            type="number"
            onChange={v => updateCombatant(combatant.id, { ac: v })}
            style={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', width: 28 }}
          />
        </div>

        {/* HP */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <span className="label">HP</span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: dying ? 'var(--c-danger)' : 'var(--c-text)' }}>
            {combatant.hp.current}<span style={{ color: 'var(--c-muted)', fontWeight: 400 }}>/{combatant.hp.max}</span>
          </span>
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
              onChange={v => updateCombatant(combatant.id, { spellSaveDC: v || null })}
            />
            <StatPill
              label="Spell Atk"
              value={combatant.spellAttackBonus ?? ''}
              onChange={v => updateCombatant(combatant.id, { spellAttackBonus: v || null })}
            />
            <StatPill
              label="Init Bonus"
              value={combatant.initiative.bonus}
              onChange={v => updateCombatant(combatant.id, { initiative: { ...combatant.initiative, bonus: v } })}
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Conditions</div>
            <div className="flex flex-wrap" style={{ gap: 4 }}>
              {CONDITIONS.map(cond => {
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
