import { useState } from 'react'
import { DEFAULT_ABILITIES } from '../../store/characterStore'

const ABILITY_LABELS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function mod(score) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

/**
 * Shared modal for creating and editing characters.
 * Props:
 *  - initial: prefill values (template shape: { name, type, hp, ac, initiativeBonus, ... })
 *  - onClose: called to dismiss
 *  - onSave(data): called with template-shaped data
 *  - title: modal header text
 *  - lockedType: if set, hides type toggle and forces this type
 */
export default function CharacterFormModal({ initial, onClose, onSave, title, lockedType }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(lockedType ?? initial?.type ?? 'ally')
  const [hp, setHp] = useState(String(initial?.hp ?? 10))
  const [ac, setAc] = useState(String(initial?.ac ?? 10))
  const [initBonus, setInitBonus] = useState(String(initial?.initiativeBonus ?? 0))
  const [spellDC, setSpellDC] = useState(initial?.spellSaveDC != null ? String(initial.spellSaveDC) : '')
  const [spellAtk, setSpellAtk] = useState(initial?.spellAttackBonus != null ? String(initial.spellAttackBonus) : '')
  const initAbilities = initial?.abilities ?? DEFAULT_ABILITIES
  const [abilities, setAbilities] = useState(Object.fromEntries(Object.entries({ ...initAbilities }).map(([k, v]) => [k, String(v)])))
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const setAbility = (key, val) => setAbilities(prev => ({ ...prev, [key]: val }))

  const submit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      type: lockedType ?? type,
      hp: parseInt(hp, 10) || 1,
      ac: parseInt(ac, 10) || 1,
      initiativeBonus: parseInt(initBonus, 10) || 0,
      spellSaveDC: spellDC === '' ? null : Number(spellDC),
      spellAttackBonus: spellAtk === '' ? null : Number(spellAtk),
      legendary: initial?.legendary ?? null,
      notes,
      abilities: Object.fromEntries(Object.entries(abilities).map(([k, v]) => [k, parseInt(v, 10) || 10])),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', padding: 16, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth: 400, padding: 20, boxShadow: '0 24px 64px var(--c-shadow)', margin: 'auto' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}>✕</button>
        </div>
        <div className="flex flex-col" style={{ gap: 10 }}>
          {/* Name */}
          <input autoFocus placeholder="Name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ minHeight: 44, fontSize: '0.95rem' }} />

          {/* Type toggle — hidden when type is locked */}
          {!lockedType && (
            <div className="flex" style={{ gap: 4 }}>
              {['ally', 'enemy'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, minHeight: 34, minWidth: 'unset', fontSize: '0.8rem', fontWeight: 600, borderRadius: 6,
                    border: type === t ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
                    background: type === t ? 'var(--c-accent-dim)' : 'transparent',
                    color: type === t ? 'var(--c-accent)' : 'var(--c-muted)',
                    textTransform: 'capitalize',
                  }}
                >{t}</button>
              ))}
            </div>
          )}

          {/* Core stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Max HP', val: hp, set: setHp },
              { label: 'AC', val: ac, set: setAc },
              { label: 'Init Bonus', val: initBonus, set: setInitBonus },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex flex-col" style={{ gap: 4 }}>
                <span className="label">{label}</span>
                <input type="text" inputMode="numeric" value={val} onChange={e => set(e.target.value)} style={{ minHeight: 38, minWidth: 0, width: '100%', textAlign: 'center' }} />
              </label>
            ))}
          </div>

          {/* Ability scores */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Ability Scores</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {ABILITY_LABELS.map(a => (
                <label key={a} className="flex flex-col" style={{ gap: 2, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-muted)' }}>{a}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={abilities[a]}
                    onChange={e => setAbility(a, e.target.value)}
                    style={{ minHeight: 34, minWidth: 0, width: '100%', textAlign: 'center', fontSize: '0.8rem' }}
                  />
                  <span style={{ fontSize: '0.6rem', color: 'var(--c-muted)' }}>{mod(parseInt(abilities[a], 10) || 10)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Spell stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label className="flex flex-col" style={{ gap: 4 }}>
              <span className="label">Spell Save DC</span>
              <input type="text" inputMode="numeric" placeholder="—" value={spellDC} onChange={e => setSpellDC(e.target.value)} style={{ minHeight: 38, minWidth: 0, width: '100%', textAlign: 'center' }} />
            </label>
            <label className="flex flex-col" style={{ gap: 4 }}>
              <span className="label">Spell Atk Bonus</span>
              <input type="text" inputMode="numeric" placeholder="—" value={spellAtk} onChange={e => setSpellAtk(e.target.value)} style={{ minHeight: 38, minWidth: 0, width: '100%', textAlign: 'center' }} />
            </label>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{ width: '100%', resize: 'none', fontSize: '0.8rem', minHeight: 48 }}
          />

          {/* Actions */}
          <div className="flex justify-end" style={{ gap: 8, marginTop: 4 }}>
            <button onClick={onClose} className="btn-ghost" style={{ minHeight: 40, minWidth: 'unset' }}>Cancel</button>
            <button onClick={submit} className="btn-primary" style={{ minHeight: 40, minWidth: 'unset', padding: '0 20px' }}>
              {initial ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
