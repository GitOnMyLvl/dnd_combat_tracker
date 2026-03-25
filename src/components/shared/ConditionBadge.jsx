import { CONDITION_MAP } from '../../constants/conditions'

export default function ConditionBadge({ condition, onRemove }) {
  const color = CONDITION_MAP[condition]?.color ?? '#334155'
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
