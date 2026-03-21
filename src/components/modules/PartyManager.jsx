import { useState } from 'react'
import { useCharacterStore, templateToCombatant, DEFAULT_ABILITIES } from '../../store/characterStore'
import { useEncounterStore } from '../../store/encounterStore'

const ABILITY_LABELS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function mod(score) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function CharacterCard({ char, compact, onRemove, onEdit, actions }) {
  const typeColor = char.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)'

  return (
    <div
      style={{
        padding: compact ? '6px 8px' : '8px 10px',
        borderRadius: 8,
        border: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: typeColor, fontSize: '0.55rem', flexShrink: 0 }}>●</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {char.name}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>
          HP {char.hp} · AC {char.ac} · Init {char.initiativeBonus >= 0 ? '+' : ''}{char.initiativeBonus}
        </div>
      </div>
      <div className="flex" style={{ gap: 4, flexShrink: 0 }}>
        {onEdit && (
          <button
            onClick={onEdit}
            className="btn-primary"
            style={{ minHeight: 26, minWidth: 'unset', fontSize: '0.7rem', padding: '0 8px', borderRadius: 6 }}
          >Edit</button>
        )}
        {actions}
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              background: 'none', border: 'none', color: 'var(--c-muted)',
              minHeight: 26, minWidth: 26, fontSize: '0.75rem', borderRadius: 6, padding: 0,
            }}
            title="Delete"
          >✕</button>
        )}
      </div>
    </div>
  )
}

/** Shared modal for creating and editing characters */
function CharacterFormModal({ initial, onClose, onSave, title }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'ally')
  const [hp, setHp] = useState(initial?.hp ?? 10)
  const [ac, setAc] = useState(initial?.ac ?? 10)
  const [initBonus, setInitBonus] = useState(initial?.initiativeBonus ?? 0)
  const [spellDC, setSpellDC] = useState(initial?.spellSaveDC ?? '')
  const [spellAtk, setSpellAtk] = useState(initial?.spellAttackBonus ?? '')
  const initAbilities = initial?.abilities ?? DEFAULT_ABILITIES
  const [abilities, setAbilities] = useState({ ...initAbilities })
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const setAbility = (key, val) => setAbilities(prev => ({ ...prev, [key]: parseInt(val, 10) || 0 }))

  const submit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      type,
      hp,
      ac,
      initiativeBonus: initBonus,
      spellSaveDC: spellDC === '' ? null : Number(spellDC),
      spellAttackBonus: spellAtk === '' ? null : Number(spellAtk),
      legendary: initial?.legendary ?? null,
      notes,
      abilities,
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

          {/* Type toggle */}
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

          {/* Core stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Max HP', val: hp, set: v => setHp(parseInt(v, 10) || 1) },
              { label: 'AC', val: ac, set: v => setAc(parseInt(v, 10) || 1) },
              { label: 'Init Bonus', val: initBonus, set: v => setInitBonus(parseInt(v, 10) || 0) },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex flex-col" style={{ gap: 4 }}>
                <span className="label">{label}</span>
                <input type="number" value={val} onChange={e => set(e.target.value)} style={{ minHeight: 38, minWidth: 0, width: '100%', textAlign: 'center' }} />
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
                    type="number"
                    value={abilities[a]}
                    onChange={e => setAbility(a, e.target.value)}
                    style={{ minHeight: 34, minWidth: 0, width: '100%', textAlign: 'center', fontSize: '0.8rem' }}
                  />
                  <span style={{ fontSize: '0.6rem', color: 'var(--c-muted)' }}>{mod(abilities[a])}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Spell stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label className="flex flex-col" style={{ gap: 4 }}>
              <span className="label">Spell Save DC</span>
              <input type="number" placeholder="—" value={spellDC} onChange={e => setSpellDC(e.target.value)} style={{ minHeight: 38, minWidth: 0, width: '100%', textAlign: 'center' }} />
            </label>
            <label className="flex flex-col" style={{ gap: 4 }}>
              <span className="label">Spell Atk Bonus</span>
              <input type="number" placeholder="—" value={spellAtk} onChange={e => setSpellAtk(e.target.value)} style={{ minHeight: 38, minWidth: 0, width: '100%', textAlign: 'center' }} />
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
            <button onClick={submit} className="btn-primary" style={{ minHeight: 40, minWidth: 'unset', padding: '0 20px' }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CharactersTab() {
  const { characters, removeCharacter, saveCharacter, updateCharacter } = useCharacterStore()
  const addCombatant = useEncounterStore(s => s.addCombatant)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null) // character object or null

  const addToEncounter = (char) => {
    addCombatant(templateToCombatant(char))
  }

  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary" style={{ minHeight: 28, minWidth: 'unset', fontSize: '0.72rem' }}>+ New Character</button>
      </div>

      {characters.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--c-muted)', fontSize: '0.8rem' }}>
          No saved characters yet.
          <br />
          <span style={{ fontSize: '0.72rem' }}>
            Create one here or tap <strong>Save</strong> on a combatant.
          </span>
        </div>
      )}

      {characters.map(char => (
        <CharacterCard
          key={char.id}
          char={char}
          onEdit={() => setEditing(char)}
          onRemove={() => { if (window.confirm(`Delete "${char.name}"?`)) removeCharacter(char.id) }}
          actions={
            <button
              onClick={() => addToEncounter(char)}
              className="btn-primary"
              style={{ minHeight: 26, minWidth: 'unset', fontSize: '0.7rem', padding: '0 8px', borderRadius: 6 }}
            >+ Add</button>
          }
        />
      ))}

      {showNew && (
        <CharacterFormModal
          title="New Character"
          onClose={() => setShowNew(false)}
          onSave={(data) => saveCharacter(data)}
        />
      )}

      {editing && (
        <CharacterFormModal
          title="Edit Character"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateCharacter(editing.id, data)}
        />
      )}
    </div>
  )
}

function CreatePartyModal({ onClose }) {
  const { characters, saveParty } = useCharacterStore()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = () => {
    if (!name.trim() || selected.size === 0) return
    saveParty(name.trim(), [...selected])
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth: 380, padding: 20, boxShadow: '0 24px 64px var(--c-shadow)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Create Party</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}>✕</button>
        </div>

        <div className="flex flex-col" style={{ gap: 10 }}>
          <input
            autoFocus
            placeholder="Party name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ minHeight: 44, fontSize: '0.95rem' }}
          />

          {characters.length === 0 ? (
            <div style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
              Save some characters first to create a party.
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              <div className="label" style={{ marginBottom: 2 }}>Select members</div>
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => toggle(char.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8, textAlign: 'left',
                    minHeight: 'unset', minWidth: 'unset',
                    border: selected.has(char.id) ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
                    background: selected.has(char.id) ? 'var(--c-accent-dim)' : 'var(--c-surface)',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ color: char.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.55rem' }}>●</span>
                  <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{char.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>
                    HP {char.hp} · AC {char.ac}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end" style={{ gap: 8, marginTop: 4 }}>
            <button onClick={onClose} className="btn-ghost" style={{ minHeight: 40, minWidth: 'unset' }}>Cancel</button>
            <button
              onClick={submit}
              className="btn-primary"
              style={{ minHeight: 40, minWidth: 'unset', padding: '0 20px' }}
              disabled={!name.trim() || selected.size === 0}
            >Create</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddToPartyModal({ party, onClose }) {
  const { characters, addCharacterToParty } = useCharacterStore()
  const available = characters.filter(c => !party.characterIds.includes(c.id))

  if (available.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', padding: 16 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="card w-full" style={{ maxWidth: 380, padding: 20, boxShadow: '0 24px 64px var(--c-shadow)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Add to {party.name}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}>✕</button>
          </div>
          <div style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
            All saved characters are already in this party.
          </div>
          <div className="flex justify-end" style={{ marginTop: 8 }}>
            <button onClick={onClose} className="btn-ghost" style={{ minHeight: 40, minWidth: 'unset' }}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth: 380, padding: 20, boxShadow: '0 24px 64px var(--c-shadow)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Add to {party.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 30, minWidth: 30, fontSize: '1rem', borderRadius: 6 }}>✕</button>
        </div>
        <div className="flex flex-col" style={{ gap: 4, maxHeight: 300, overflowY: 'auto' }}>
          {available.map(char => (
            <div
              key={char.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--c-border)', background: 'var(--c-surface)',
              }}
            >
              <span style={{ color: char.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.55rem' }}>●</span>
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{char.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>HP {char.hp} · AC {char.ac}</span>
              <button
                onClick={() => addCharacterToParty(party.id, char.id)}
                className="btn-primary"
                style={{ minHeight: 24, minWidth: 'unset', fontSize: '0.68rem', padding: '0 8px', borderRadius: 6 }}
              >+ Add</button>
            </div>
          ))}
        </div>
        <div className="flex justify-end" style={{ marginTop: 12 }}>
          <button onClick={onClose} className="btn-ghost" style={{ minHeight: 40, minWidth: 'unset' }}>Done</button>
        </div>
      </div>
    </div>
  )
}

function PartiesTab() {
  const { parties, characters, removeParty, removeCharacterFromParty } = useCharacterStore()
  const addCombatant = useEncounterStore(s => s.addCombatant)
  const [showCreate, setShowCreate] = useState(false)
  const [addingToParty, setAddingToParty] = useState(null)

  const encounter = useEncounterStore(s => s.encounter)

  const loadParty = (party) => {
    const existing = encounter.combatants
    const chars = party.characterIds
      .map(id => characters.find(c => c.id === id))
      .filter(Boolean)
      .filter(char => !existing.some(e => e.name === char.name && e.type === char.type))
    chars.forEach(char => addCombatant(templateToCombatant(char)))
  }

  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
          style={{ minHeight: 28, minWidth: 'unset', fontSize: '0.72rem' }}
        >+ New Party</button>
      </div>

      {parties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--c-muted)', fontSize: '0.8rem' }}>
          No parties saved yet.
        </div>
      )}

      {parties.map(party => {
        const members = party.characterIds
          .map(id => characters.find(c => c.id === id))
          .filter(Boolean)

        return (
          <div
            key={party.id}
            style={{
              border: '1px solid var(--c-border)',
              borderRadius: 10,
              background: 'var(--c-surface)',
              overflow: 'hidden',
            }}
          >
            <div className="flex items-center" style={{ padding: '8px 10px', gap: 6 }}>
              <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem' }}>{party.name}</span>
              <span style={{ color: 'var(--c-muted)', fontSize: '0.7rem' }}>{members.length}</span>
              <button
                onClick={() => setAddingToParty(party)}
                className="btn-primary"
                style={{ minHeight: 26, minWidth: 'unset', fontSize: '0.7rem', padding: '0 8px', borderRadius: 6 }}
              >+ Add</button>
              <button
                onClick={() => loadParty(party)}
                className="btn-primary"
                style={{ minHeight: 26, minWidth: 'unset', fontSize: '0.7rem', padding: '0 8px', borderRadius: 6 }}
              >Load All</button>
              <button
                onClick={() => { if (window.confirm(`Delete party "${party.name}"?`)) removeParty(party.id) }}
                style={{
                  background: 'none', border: 'none', color: 'var(--c-muted)',
                  minHeight: 26, minWidth: 26, fontSize: '0.75rem', borderRadius: 6, padding: 0,
                }}
                title="Delete party"
              >✕</button>
            </div>

            {members.length > 0 && (
              <div style={{ borderTop: '1px solid var(--c-border)', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {members.map(char => (
                  <CharacterCard
                    key={char.id}
                    char={char}
                    compact
                    onRemove={() => removeCharacterFromParty(party.id, char.id)}
                  />
                ))}
              </div>
            )}

            {members.length === 0 && (
              <div style={{ borderTop: '1px solid var(--c-border)', padding: '8px 10px', color: 'var(--c-muted)', fontSize: '0.72rem', textAlign: 'center' }}>
                All members have been deleted.
              </div>
            )}
          </div>
        )
      })}

      {showCreate && <CreatePartyModal onClose={() => setShowCreate(false)} />}
      {addingToParty && <AddToPartyModal party={addingToParty} onClose={() => setAddingToParty(null)} />}
    </div>
  )
}

export default function PartyManager() {
  const [tab, setTab] = useState('characters')

  const tabStyle = (active) => ({
    flex: 1, minHeight: 32, minWidth: 'unset',
    fontSize: '0.75rem', fontWeight: 600, borderRadius: 6,
    background: active ? 'var(--c-accent-dim)' : 'transparent',
    color: active ? 'var(--c-accent)' : 'var(--c-muted)',
    border: active ? '1px solid var(--c-accent)' : '1px solid transparent',
    transition: 'all 0.12s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 8 }}>
      {/* Tab bar */}
      <div className="flex" style={{ gap: 4, flexShrink: 0 }}>
        <button style={tabStyle(tab === 'characters')} onClick={() => setTab('characters')}>Characters</button>
        <button style={tabStyle(tab === 'parties')} onClick={() => setTab('parties')}>Parties</button>
      </div>

      {/* Content */}
      <div className="module-content" style={{ flex: 1, minHeight: 0 }}>
        {tab === 'characters' ? <CharactersTab /> : <PartiesTab />}
      </div>
    </div>
  )
}
