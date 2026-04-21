import { useLayoutStore } from '../../store/layoutStore'

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const ICONS = {
  InitiativeTracker: <Icon><path d="M4 6h16M4 12h10M4 18h16" /><circle cx="19" cy="12" r="2" fill="currentColor" /></Icon>,
  AlliesTable:       <Icon><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 11h5M18.5 8.5v5" /></Icon>,
  EnemiesTable:      <Icon><path d="M12 2.5 L21 8 L18 20 L6 20 L3 8 Z" /><circle cx="9" cy="11" r="1" fill="currentColor" /><circle cx="15" cy="11" r="1" fill="currentColor" /><path d="M9 16l3-2 3 2" /></Icon>,
  ConditionsPanel:   <Icon><path d="M12 2 L4 6 v6c0 5 4 9 8 10 4-1 8-5 8-10V6z" /><path d="M9 12l2 2 4-4" /></Icon>,
  DiceRoller:        <Icon><path d="M12 3 L21 8 L12 13 L3 8 Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></Icon>,
  NotesPad:          <Icon><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4" /></Icon>,
  PartyManager:      <Icon><circle cx="8" cy="9" r="2.5" /><circle cx="16" cy="9" r="2.5" /><path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13 19c0-2.8 2.2-5 5-5s3 1 3 3" /></Icon>,
  AoeDamage:         <Icon><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" opacity="0.55" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></Icon>,
}

const AVAILABLE_MODULES = [
  { type: 'InitiativeTracker', icon: ICONS.InitiativeTracker, label: 'Initiative Tracker', desc: 'Turn order, round counter', config: {} },
  { type: 'CombatantTable',    icon: ICONS.AlliesTable,       label: 'Allies Table',       desc: 'HP, AC, conditions for your party', config: { tableType: 'ally' } },
  { type: 'CombatantTable',    icon: ICONS.EnemiesTable,      label: 'Enemies Table',      desc: 'Monsters — search or add manually', config: { tableType: 'enemy' } },
  { type: 'ConditionsPanel',   icon: ICONS.ConditionsPanel,   label: 'Conditions',         desc: 'Apply conditions to selected combatant', config: {} },
  { type: 'DiceRoller',        icon: ICONS.DiceRoller,        label: 'Dice Roller',        desc: 'd4–d100, advantage, custom rolls', config: {} },
  { type: 'NotesPad',          icon: ICONS.NotesPad,          label: 'Notes',              desc: 'Free text, auto-saved', config: {} },
  { type: 'PartyManager',      icon: ICONS.PartyManager,      label: 'Party Manager',      desc: 'Save characters & parties', config: {} },
  { type: 'AoeDamage',         icon: ICONS.AoeDamage,         label: 'AoE Damage',         desc: 'Damage or heal many at once', config: {} },
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
      style={{ background: 'rgba(0,0,0,0.55)', padding: 'var(--sp-4)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full" style={{ maxWidth: 560, padding: 'var(--sp-5)', boxShadow: 'var(--shadow-pop)', position: 'relative' }}>
        <div className="accent-stripe" />

        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="display" style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.08em' }}>Add Module</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--c-muted)',
              minHeight: 32, minWidth: 32, fontSize: '1rem', borderRadius: 6,
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >✕</button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--sp-2)',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {AVAILABLE_MODULES.map(m => (
            <button
              key={`${m.type}-${m.label}`}
              onClick={() => add(m.type, m.config)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                padding: 'var(--sp-3)', borderRadius: 10,
                background: 'var(--c-elevated)',
                border: '1px solid var(--c-border)',
                textAlign: 'left', minHeight: 70, minWidth: 'unset',
                transition: 'background 0.12s, border-color 0.12s, transform 0.08s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--c-hover)'
                e.currentTarget.style.borderColor = 'var(--c-accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--c-elevated)'
                e.currentTarget.style.borderColor = 'var(--c-border)'
              }}
            >
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                borderRadius: 8,
                background: 'var(--c-accent-soft)',
                color: 'var(--c-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="display" style={{ fontWeight: 600, fontSize: '0.88rem', letterSpacing: '0.03em' }}>{m.label}</div>
                <div style={{ color: 'var(--c-muted)', fontSize: '0.74rem', marginTop: 3, lineHeight: 1.4 }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
