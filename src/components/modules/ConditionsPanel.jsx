import { useEncounterStore } from '../../store/encounterStore'
import { CONDITIONS } from '../../constants/conditions'

export default function ConditionsPanel() {
  const { selectedCombatantId, encounter, toggleCondition } = useEncounterStore()
  const selected = encounter.combatants.find(c => c.id === selectedCombatantId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 8 }}>
      {/* Target indicator */}
      <div style={{ flexShrink: 0, minHeight: 28 }}>
        {selected ? (
          <div style={{ fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--c-muted)' }}>Targeting </span>
            <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{selected.name}</span>
            {selected.conditions.length > 0 && (
              <span style={{ color: 'var(--c-muted)', marginLeft: 6, fontSize: '0.82rem' }}>
                {selected.conditions.length} condition{selected.conditions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.88rem', color: 'var(--c-muted)' }}>
            Select a combatant to apply conditions
          </div>
        )}
      </div>

      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, alignContent: 'start' }}>
        {CONDITIONS.map(({ name, color, desc }) => {
          const active = selected?.conditions.includes(name)
          return (
            <button
              key={name}
              onClick={() => selected && toggleCondition(selected.id, name)}
              disabled={!selected}
              title={desc}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                border: active ? `1px solid ${color}` : '1px solid var(--c-border)',
                background: active ? `${color}20` : 'var(--c-elevated)',
                minHeight: 50, minWidth: 'unset',
                cursor: selected ? 'pointer' : 'not-allowed',
                opacity: !selected ? 0.35 : 1,
                transition: 'background 0.12s, border-color 0.12s',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: active ? '#e8e8e8' : 'var(--c-text)' }}>
                {active && <span style={{ color, marginRight: 4 }}>✓</span>}{name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--c-muted)', marginTop: 2, lineHeight: 1.3 }}>{desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
