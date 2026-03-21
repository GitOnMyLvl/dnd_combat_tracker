import { useLayoutStore } from '../../store/layoutStore'

const MODULE_TITLES = {
  InitiativeTracker: 'Initiative',
  CombatantTable:    null,
  ConditionsPanel:   'Conditions',
  DiceRoller:        'Dice',
  NotesPad:          'Notes',
}

export default function ModuleWrapper({ id, type, config = {}, minimized, children }) {
  const { removeModule, toggleMinimize } = useLayoutStore()

  let title = MODULE_TITLES[type] ?? type
  if (type === 'CombatantTable') {
    title = config.tableType === 'ally' ? 'Allies' : 'Enemies'
  }

  return (
    <div className="card flex flex-col h-full" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0 select-none"
        style={{
          height: 40,
          borderBottom: minimized ? 'none' : '1px solid var(--c-border)',
        }}
      >
        {/* Drag handle: grip + title */}
        <div className="drag-handle flex items-center gap-2" style={{ flex: 1, cursor: 'grab', height: '100%' }}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ opacity: 0.25, flexShrink: 0 }}>
            {[0,4,8,12].map(y => [0,4].map(x => (
              <circle key={`${x}-${y}`} cx={x+1} cy={y+2} r={1} fill="currentColor"/>
            )))}
          </svg>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--c-muted2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>

        {/* Controls — outside drag handle */}
        <div className="flex items-center" style={{ gap: 4 }}>
          <button
            onClick={() => toggleMinimize(id)}
            title={minimized ? 'Expand' : 'Collapse'}
            style={{
              height: 36, width: 36, minHeight: 36, minWidth: 36,
              background: 'none', border: 'none',
              color: 'var(--c-muted)', fontSize: '0.85rem',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >
            {minimized ? '↑' : '↓'}
          </button>
          <button
            onClick={() => removeModule(id)}
            title="Remove"
            style={{
              height: 36, width: 36, minHeight: 36, minWidth: 36,
              background: 'none', border: 'none',
              color: 'var(--c-muted)', fontSize: '0.95rem',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-danger)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >✕</button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div style={{ position: 'absolute', inset: 0, padding: '10px 12px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
