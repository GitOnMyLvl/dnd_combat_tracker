import { useState } from 'react'
import { useCharacterStore, templateToCombatant } from '../../store/characterStore'
import { useEncounterStore } from '../../store/encounterStore'
import CharacterFormModal from '../shared/CharacterFormModal'
import Modal from '../shared/Modal'

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
      <span style={{ color: typeColor, fontSize: '0.65rem', flexShrink: 0 }}>●</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {char.name}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>
          HP {char.hp} · AC {char.ac} · Init {char.initiativeBonus >= 0 ? '+' : ''}{char.initiativeBonus}
        </div>
      </div>
      <div className="flex" style={{ gap: 4, flexShrink: 0 }}>
        {onEdit && (
          <button
            onClick={onEdit}
            className="btn-primary"
            style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.8rem', padding: '0 12px', borderRadius: 6 }}
          >Edit</button>
        )}
        {actions}
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              background: 'none', border: 'none', color: 'var(--c-muted)',
              minHeight: 36, minWidth: 36, fontSize: '0.85rem', borderRadius: 6, padding: 0,
            }}
            title="Delete"
          >✕</button>
        )}
      </div>
    </div>
  )
}

function CharactersTab() {
  const { characters, removeCharacter, saveCharacter, updateCharacter } = useCharacterStore()
  const addCombatant = useEncounterStore(s => s.addCombatant)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null) // character object or null
  const [flashIds, setFlashIds] = useState(new Set())

  const addToEncounter = (char) => {
    addCombatant(templateToCombatant(char))
    setFlashIds(prev => new Set([...prev, char.id]))
    setTimeout(() => setFlashIds(prev => { const n = new Set(prev); n.delete(char.id); return n }), 1200)
  }

  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="btn-primary" style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.82rem' }}>+ New Character</button>
      </div>

      {characters.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--c-muted)', fontSize: '0.9rem' }}>
          No saved characters yet.
          <br />
          <span style={{ fontSize: '0.82rem' }}>
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
              style={{
                minHeight: 36, minWidth: 'unset', fontSize: '0.8rem', padding: '0 12px', borderRadius: 6,
                color: flashIds.has(char.id) ? 'var(--c-success)' : undefined,
                borderColor: flashIds.has(char.id) ? 'var(--c-success)' : undefined,
                background: flashIds.has(char.id) ? 'rgba(74,222,128,0.1)' : undefined,
              }}
            >{flashIds.has(char.id) ? '✓ Added' : '+ Add'}</button>
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
    if (!name.trim()) return
    saveParty(name.trim(), [...selected])
    onClose()
  }

  return (
    <Modal title="Create Party" onClose={onClose} inline>
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
          <div style={{ color: 'var(--c-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '8px 0' }}>
            No saved characters yet — you can add members later.
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
                <span style={{ color: char.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.65rem' }}>●</span>
                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{char.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>
                  HP {char.hp} · AC {char.ac}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end" style={{ gap: 8, marginTop: 4 }}>
          <button onClick={onClose} className="btn-ghost" style={{ minHeight: 36, minWidth: 'unset' }}>Cancel</button>
          <button
            onClick={submit}
            className="btn-primary"
            style={{ minHeight: 36, minWidth: 'unset', padding: '0 20px' }}
            disabled={!name.trim()}
          >Create</button>
        </div>
      </div>
    </Modal>
  )
}

function AddToPartyModal({ party, onClose }) {
  const { characters, addCharacterToParty } = useCharacterStore()
  const [addedIds, setAddedIds] = useState(new Set())
  const available = characters.filter(c => !party.characterIds.includes(c.id))

  const handleAdd = (charId) => {
    addCharacterToParty(party.id, charId)
    setAddedIds(prev => new Set([...prev, charId]))
  }

  if (available.length === 0) {
    return (
      <Modal title={`Add to ${party.name}`} onClose={onClose} inline>
        <div style={{ color: 'var(--c-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
          All saved characters are already in this party.
        </div>
        <div className="flex justify-end" style={{ marginTop: 8 }}>
          <button onClick={onClose} className="btn-ghost" style={{ minHeight: 36, minWidth: 'unset' }}>Close</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Add to ${party.name}`} onClose={onClose} inline>
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
            <span style={{ color: char.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.65rem' }}>●</span>
            <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{char.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>HP {char.hp} · AC {char.ac}</span>
            <button
              onClick={() => !addedIds.has(char.id) && handleAdd(char.id)}
              disabled={addedIds.has(char.id)}
              style={{
                minHeight: 24, minWidth: 'unset', fontSize: '0.78rem', padding: '0 8px', borderRadius: 6,
                border: addedIds.has(char.id) ? '1px solid var(--c-success)' : '1px solid var(--c-accent)',
                background: addedIds.has(char.id) ? 'rgba(74,222,128,0.1)' : 'var(--c-accent)',
                color: addedIds.has(char.id) ? 'var(--c-success)' : '#fff',
                cursor: addedIds.has(char.id) ? 'default' : 'pointer',
              }}
            >{addedIds.has(char.id) ? '✓' : '+ Add'}</button>
          </div>
        ))}
      </div>
      <div className="flex justify-end" style={{ marginTop: 12 }}>
        <button onClick={onClose} className="btn-ghost" style={{ minHeight: 36, minWidth: 'unset' }}>Done</button>
      </div>
    </Modal>
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
          style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.82rem' }}
        >+ New Party</button>
      </div>

      {parties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--c-muted)', fontSize: '0.9rem' }}>
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
              <span style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>{party.name}</span>
              <span style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>{members.length}</span>
              <button
                onClick={() => setAddingToParty(party)}
                className="btn-primary"
                style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.8rem', padding: '0 12px', borderRadius: 6 }}
              >+ Add</button>
              <button
                onClick={() => loadParty(party)}
                className="btn-primary"
                style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.8rem', padding: '0 12px', borderRadius: 6 }}
              >Load All</button>
              <button
                onClick={() => { if (window.confirm(`Delete party "${party.name}"?`)) removeParty(party.id) }}
                style={{
                  background: 'none', border: 'none', color: 'var(--c-muted)',
                  minHeight: 36, minWidth: 36, fontSize: '0.85rem', borderRadius: 6, padding: 0,
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
              <div style={{ borderTop: '1px solid var(--c-border)', padding: '8px 10px', color: 'var(--c-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                No members
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
    flex: 1, minHeight: 36, minWidth: 'unset',
    fontSize: '0.85rem', fontWeight: 600, borderRadius: 6,
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
