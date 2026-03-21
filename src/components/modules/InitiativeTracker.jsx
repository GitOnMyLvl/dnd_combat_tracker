import { useEncounterStore } from '../../store/encounterStore'

export default function InitiativeTracker() {
  const {
    encounter,
    nextTurn, prevTurn,
    sortInitiative, setInitiativeRoll,
    selectCombatant, selectedCombatantId,
    addToInitiative,
  } = useEncounterStore()

  const { initiativeOrder, combatants, currentTurnIndex, round } = encounter

  const ordered = initiativeOrder
    .map(id => combatants.find(c => c.id === id))
    .filter(Boolean)

  const unordered = combatants.filter(c => !initiativeOrder.includes(c.id))
  const currentId = initiativeOrder[currentTurnIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 8 }}>
      {/* Round row */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ gap: 8 }}>
        <div>
          <div className="label">Round</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-accent)', lineHeight: 1 }}>{round}</div>
        </div>
        <div className="flex" style={{ gap: 5 }}>
          <button
            onClick={prevTurn}
            className="btn-ghost"
            style={{ minHeight: 38, minWidth: 38, padding: 0, justifyContent: 'center', fontSize: '0.8rem' }}
            disabled={initiativeOrder.length === 0}
          >◀</button>
          <button
            onClick={nextTurn}
            className="btn-primary"
            style={{ minHeight: 38, minWidth: 'unset', padding: '0 14px', fontSize: '0.8rem' }}
            disabled={initiativeOrder.length === 0}
          >Next ▶</button>
        </div>
      </div>

      <button
        onClick={sortInitiative}
        className="btn-ghost flex-shrink-0"
        style={{ minHeight: 36, minWidth: 'unset', width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
        disabled={combatants.length === 0}
      >Sort by Initiative</button>

      <hr className="divider flex-shrink-0" />

      {/* List */}
      <div className="module-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ordered.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>
            Add combatants, set rolls, then sort.
          </p>
        )}

        {ordered.map((c, idx) => {
          const isActive = c.id === currentId
          const isSelected = c.id === selectedCombatantId
          const total = c.initiative.roll + c.initiative.bonus

          return (
            <div
              key={c.id}
              onClick={() => selectCombatant(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                background: isActive ? 'var(--c-accent-dim)' : isSelected ? 'var(--c-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--c-accent)' : '1px solid transparent',
                minHeight: 46, transition: 'background 0.1s',
              }}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: '0.65rem', color: isActive ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 700, flexShrink: 0 }}>
                {isActive ? '▶' : idx + 1}
              </span>

              <input
                type="number"
                value={c.initiative.roll}
                onChange={e => setInitiativeRoll(c.id, parseInt(e.target.value, 10) || 0)}
                onClick={e => e.stopPropagation()}
                style={{ width: 38, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', minHeight: 32, padding: '2px 4px' }}
                title="Roll"
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--c-muted)', marginTop: 1 }}>
                  <span style={{ color: c.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)' }}>●</span>
                  {' '}{c.hp.current}/{c.hp.max} HP
                </div>
              </div>

              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isActive ? 'var(--c-accent)' : 'var(--c-text)', minWidth: 20, textAlign: 'right' }}>{total}</span>
            </div>
          )
        })}

        {unordered.length > 0 && (
          <>
            <div style={{ color: 'var(--c-muted)', fontSize: '0.68rem', padding: '4px 4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Not in initiative</div>
            {unordered.map(c => (
              <div
                key={c.id}
                onClick={() => selectCombatant(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                  opacity: 0.45, minHeight: 46,
                  border: '1px solid transparent',
                }}
              >
                <input
                  type="number"
                  value={c.initiative.roll}
                  onChange={e => setInitiativeRoll(c.id, parseInt(e.target.value, 10) || 0)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 38, textAlign: 'center', fontSize: '0.82rem', minHeight: 32, padding: '2px 4px' }}
                />
                <span style={{ flex: 1, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <button
                  onClick={e => { e.stopPropagation(); addToInitiative(c.id) }}
                  className="btn-ghost"
                  style={{ minHeight: 30, minWidth: 30, padding: 0, fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Add to initiative"
                >+</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
