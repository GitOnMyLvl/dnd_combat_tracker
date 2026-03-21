import { useLayoutStore } from '../../store/layoutStore'

const AVAILABLE_MODULES = [
  { type: 'InitiativeTracker', label: 'Initiative Tracker', desc: 'Turn order, round counter', config: {} },
  { type: 'CombatantTable', label: 'Allies Table', desc: 'HP, AC, conditions for your party', config: { tableType: 'ally' } },
  { type: 'CombatantTable', label: 'Enemies Table', desc: 'Monsters — search or add manually', config: { tableType: 'enemy' } },
  { type: 'ConditionsPanel', label: 'Conditions', desc: 'Apply conditions to selected combatant', config: {} },
  { type: 'DiceRoller', label: 'Dice Roller', desc: 'd4–d100, advantage, custom rolls', config: {} },
  { type: 'NotesPad', label: 'Notes', desc: 'Free text, auto-saved', config: {} },
]

export default function ModulePicker({ onClose }) {
  const addModule = useLayoutStore(s => s.addModule)

  const add = (type, config) => {
    addModule(type, config)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth: 440, padding: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Add Module</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 32, minWidth: 32, fontSize: '1rem', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--c-muted)'}
          >✕</button>
        </div>

        <div className="flex flex-col" style={{ gap: 6, maxHeight: '70vh', overflowY: 'auto' }}>
          {AVAILABLE_MODULES.map(m => (
            <button
              key={`${m.type}-${m.label}`}
              onClick={() => add(m.type, m.config)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 9,
                background: 'var(--c-elevated)',
                border: '1px solid var(--c-border)',
                textAlign: 'left', minHeight: 58, minWidth: 'unset',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-hover)'; e.currentTarget.style.borderColor = 'var(--c-border-strong)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-elevated)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.label}</div>
                <div style={{ color: 'var(--c-muted)', fontSize: '0.75rem', marginTop: 2 }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
