const CONDITION_COLORS = {
  Blinded:      '#52525b',
  Charmed:      '#be185d',
  Deafened:     '#52525b',
  Exhaustion:   '#78350f',
  Frightened:   '#6d28d9',
  Grappled:     '#7c3aed',
  Incapacitated:'#b91c1c',
  Invisible:    '#71717a',
  Paralyzed:    '#b91c1c',
  Petrified:    '#57534e',
  Poisoned:     '#15803d',
  Prone:        '#92400e',
  Restrained:   '#7c2d12',
  Stunned:      '#b91c1c',
  Unconscious:  '#1e40af',
  Concentration:'#d97706',
}

export default function ConditionBadge({ condition, onRemove }) {
  const color = CONDITION_COLORS[condition] ?? '#334155'
  return (
    <span
      className="inline-flex items-center"
      style={{
        background: color + '33',
        border: `1px solid ${color}88`,
        borderRadius: 100,
        padding: '1px 7px',
        fontSize: '0.68rem',
        fontWeight: 600,
        color: '#e8e8e8',
        gap: 3,
      }}
    >
      {condition}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: '#aaa', padding: 0, minHeight: 'unset', minWidth: 'unset', lineHeight: 1, fontSize: '0.75rem', cursor: 'pointer' }}
          aria-label={`Remove ${condition}`}
        >×</button>
      )}
    </span>
  )
}
