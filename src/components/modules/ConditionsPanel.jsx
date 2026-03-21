import { useEncounterStore } from '../../store/encounterStore'

const CONDITIONS = [
  { name: 'Blinded',       color: '#71717a', desc: 'Auto-fail sight checks, attacks at disadv.' },
  { name: 'Charmed',       color: '#be185d', desc: 'Can\'t attack charmer, adv on charmer\'s social' },
  { name: 'Deafened',      color: '#71717a', desc: 'Auto-fail hearing checks' },
  { name: 'Frightened',    color: '#7c3aed', desc: 'Disadv while source is visible' },
  { name: 'Grappled',      color: '#92400e', desc: 'Speed 0' },
  { name: 'Incapacitated', color: '#b91c1c', desc: 'No actions or reactions' },
  { name: 'Invisible',     color: '#52525b', desc: 'Attacks against disadv, attacks with adv' },
  { name: 'Paralyzed',     color: '#b91c1c', desc: 'Incapacitated + auto-fail Str/Dex saves' },
  { name: 'Petrified',     color: '#78716c', desc: 'Stone, incapacitated, resistant all' },
  { name: 'Poisoned',      color: '#15803d', desc: 'Disadv on attacks and ability checks' },
  { name: 'Prone',         color: '#92400e', desc: 'Melee adv against, ranged disadv against' },
  { name: 'Restrained',    color: '#7c2d12', desc: 'Speed 0, attacks against adv, own disadv' },
  { name: 'Stunned',       color: '#b91c1c', desc: 'Incapacitated + auto-fail Str/Dex' },
  { name: 'Unconscious',   color: '#1e40af', desc: 'Incapacitated + prone, crits within 5ft' },
  { name: 'Concentration', color: '#d97706', desc: 'Currently concentrating on a spell' },
  { name: 'Exhaustion',    color: '#78350f', desc: 'Stacking penalty levels 1-6' },
]

export default function ConditionsPanel() {
  const { selectedCombatantId, encounter, toggleCondition } = useEncounterStore()
  const selected = encounter.combatants.find(c => c.id === selectedCombatantId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 8 }}>
      {/* Target indicator */}
      <div style={{ flexShrink: 0, minHeight: 28 }}>
        {selected ? (
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--c-muted)' }}>Targeting </span>
            <span style={{ fontWeight: 700, color: 'var(--c-text)' }}>{selected.name}</span>
            {selected.conditions.length > 0 && (
              <span style={{ color: 'var(--c-muted)', marginLeft: 6, fontSize: '0.72rem' }}>
                {selected.conditions.length} condition{selected.conditions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>
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
              <span style={{ fontWeight: 600, fontSize: '0.78rem', color: active ? '#e8e8e8' : 'var(--c-text)' }}>
                {active && <span style={{ color, marginRight: 4 }}>✓</span>}{name}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--c-muted)', marginTop: 2, lineHeight: 1.3 }}>{desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
