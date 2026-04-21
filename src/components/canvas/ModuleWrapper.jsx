import { useState, useRef } from 'react'
import { useLayoutStore } from '../../store/layoutStore'

const MODULE_TITLES = {
  InitiativeTracker: 'Initiative',
  CombatantTable:    null,
  ConditionsPanel:   'Conditions',
  DiceRoller:        'Dice',
  NotesPad:          'Notes',
  PartyManager:      'Party',
}

const MODULE_INFO = {
  InitiativeTracker: {
    title: 'Initiative Tracker',
    body: `Manages turn order, HP, and round count during combat.

Turn Order
• Enter each combatant's dice roll in the small input on the left of their name
• Auto mode: final initiative = roll + bonus. Manual mode: you type the total directly
• Hit "Sort by Initiative" to lock in the order
• Use ▲ / ▼ to manually reorder combatants after sorting
• ▶ / ◀ buttons step forward or backward through turns
• The active combatant is highlighted and marked with ▶
• Combatants not yet added to the order appear in a "Not in initiative" section at the bottom — give them a roll and hit + to include them

HP & Damage
• Use the ± input + DMG / HEAL buttons on each row to update HP on the fly
• The HP bar changes color: green → orange → red as HP drops
• When HP hits 0, the combatant gets a DOWN badge and a red border

Death Saves
• Death save pips appear automatically when a combatant is downed (HP = 0)
• Click the ✓ pips to record successes, ✗ pips for failures
• 3 successes → STABLE · 3 failures → DEAD
• Hit ↺ to reset death saves

Ability Scores
• When the panel is wide enough, each combatant's six ability scores are shown for quick reference`,
  },
  CombatantTable_ally: {
    title: 'Allies Table',
    body: `Tracks your party members during combat.

• Click "+ Add Ally" to create a character manually
• Click any row to expand it — shows HP editor, conditions, ability scores, spell stats and notes
• Edit stats inline by clicking on any value (AC, abilities, etc.)
• Load saved characters from the Party Manager module
• Conditions applied here are reflected in the Conditions panel`,
  },
  CombatantTable_enemy: {
    title: 'Enemies Table',
    body: `Tracks monsters and enemies during combat.

• Click "+ Add Enemy" to create one manually, or use "Search Monsters" to look up any creature from the D&D 5e SRD
• Click any row to expand it — shows HP editor, AC, conditions, ability scores and more
• The reset button (↺) on API-sourced monsters restores all stats to the original values
• Click a row to select that combatant — the Conditions panel will then apply to them`,
  },
  ConditionsPanel: {
    title: 'Conditions',
    body: `Apply and remove status conditions from combatants.

• First select a combatant by clicking their row in the Allies or Enemies table
• Then click any condition to toggle it on or off
• Active conditions are highlighted and shown as badges on the combatant's row
• Hover a condition name for a short rules reminder`,
  },
  DiceRoller: {
    title: 'Dice Roller',
    body: `Roll any standard dice with modifiers.

• Click a die button (d4, d6, d8, d10, d12, d20, d100) to roll it once
• Advantage: rolls twice, takes the higher result
• Disadvantage: rolls twice, takes the lower result
• Custom field: type any expression like 2d6+3 or d20-1 and press Enter
• The last 20 rolls are shown in the history below`,
  },
  NotesPad: {
    title: 'Notes',
    body: `A free-text scratch pad for the session.

• Type anything — spell slots, loot, reminders, NPC names
• Auto-saved to your browser`,
  },
  PartyManager: {
    title: 'Party Manager',
    body: `Save and reuse characters across encounters.

• Characters tab: create reusable character cards with full stats. Load any character directly into the current encounter
• Parties tab: group characters into a named party and load the whole group into the encounter at once
• Characters saved here persist between sessions`,
  },
}

function getInfo(type, config) {
  if (type === 'CombatantTable') {
    return MODULE_INFO[`CombatantTable_${config.tableType ?? 'ally'}`]
  }
  return MODULE_INFO[type] ?? null
}

export default function ModuleWrapper({ id, type, config = {}, minimized, children }) {
  const { removeModule, toggleMinimize } = useLayoutStore()
  const [infoOpen, setInfoOpen] = useState(false)
  const wrapperRef = useRef(null)

  let title = MODULE_TITLES[type] ?? type
  if (type === 'CombatantTable') {
    title = config.tableType === 'ally' ? 'Allies' : 'Enemies'
  }

  const info = getInfo(type, config)

  const popOut = () => {
    const el = wrapperRef.current
    const w = el ? Math.max(320, Math.min(800, el.offsetWidth)) : 420
    const h = el ? Math.max(480, Math.min(900, el.offsetHeight)) : 680
    const cfg = encodeURIComponent(JSON.stringify(config))
    const url = `${window.location.origin}${window.location.pathname}?popout=${encodeURIComponent(type)}&config=${cfg}`
    window.open(url, '_blank', `popup=yes,width=${w},height=${h}`)
  }

  const btnStyle = {
    height: 44, width: 44, minHeight: 44, minWidth: 44,
    background: 'none', border: 'none',
    color: 'var(--c-muted)', fontSize: '0.85rem',
    borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div ref={wrapperRef} className="card flex flex-col h-full" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Accent stripe */}
      <div className="accent-stripe" />

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0 select-none"
        style={{
          height: 52,
          borderBottom: minimized ? 'none' : '1px solid var(--c-border)',
          background: 'linear-gradient(180deg, var(--c-elevated) 0%, transparent 140%)',
        }}
      >
        {/* Drag handle: grip + title */}
        <div className="drag-handle flex items-center gap-2" style={{ flex: 1, cursor: 'grab', height: '100%' }}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
            {[0,4,8,12].map(y => [0,4].map(x => (
              <circle key={`${x}-${y}`} cx={x+1} cy={y+2} r={1} fill="currentColor"/>
            )))}
          </svg>
          <span
            className="display"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--c-text)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </span>
        </div>

        {/* Controls — outside drag handle */}
        <div className="flex items-center" style={{ gap: 4 }}>
          {info && (
            <button
              onClick={() => setInfoOpen(o => !o)}
              title="About this module"
              style={{ ...btnStyle, color: infoOpen ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 700, fontSize: '0.8rem' }}
              onMouseEnter={e => { e.currentTarget.style.color = infoOpen ? 'var(--c-accent)' : 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.color = infoOpen ? 'var(--c-accent)' : 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
            >?</button>
          )}
          <button
            onClick={popOut}
            title="Open in new window"
            aria-label="Open in new window"
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >⧉</button>
          <button
            onClick={() => toggleMinimize(id)}
            title={minimized ? 'Expand' : 'Collapse'}
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >
            {minimized ? '↑' : '↓'}
          </button>
          <button
            onClick={() => removeModule(id)}
            title="Remove"
            style={btnStyle}
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

          {/* Info overlay */}
          {infoOpen && info && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'var(--c-bg)', overflowY: 'auto', padding: '14px 16px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span className="display" style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.06em' }}>{info.title}</span>
                <button
                  onClick={() => setInfoOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 28, minWidth: 28, fontSize: '0.9rem', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
                >✕</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', whiteSpace: 'pre-line', lineHeight: 1.7, margin: 0 }}>
                {info.body}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
