import { useState, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useLayoutStore } from '../../store/layoutStore'

const MODULE_TITLES = {
  InitiativeTracker: 'Initiative',
  CombatantTable:    null,
  DiceRoller:        'Dice',
  NotesPad:          'Notes',
  PartyManager:      'Party',
  AoeDamage:         'AoE Damage',
}

const MODULE_INFO = {
  InitiativeTracker: {
    title: 'Initiative Tracker',
    body: `Manages turn order, HP and the round count during combat.

Turn Order
• Everyone you add (tables, monster search, parties, + Token) joins the order automatically
• Type each initiative roll in the box left of the name, then hit Sort
• Auto: type the d20 roll; the combatant's initiative bonus is added for you
• Manual: type the final total (e.g. what a player calls out); the bonus is not added
• Ties are broken by Dexterity score
• ▲ / ▼ reorder by hand; Next ▶ / ◀ step through turns, the round counts up automatically
• "Out of Combat" holds anyone you removed from the order; → Combat brings them back

HP & Damage
• Use the amount field with DMG / HEAL on each row; damage uses up temp HP first
• The HP bar goes green → orange → red as HP drops

Death Saves
• Pips appear when a combatant is at 0 HP
• 3 successes → STABLE · 3 failures → DEAD · ↺ resets`,
  },
  CombatantTable_ally: {
    title: 'Allies Table',
    body: `Tracks your party members during combat.

• "+ Add" creates a character; saved characters and parties come from the Party Manager
• Tap a row to expand it: HP, temp HP, conditions, exhaustion, ability scores, spell stats and notes
• Tap any value (AC, abilities, …) to edit it`,
  },
  CombatantTable_enemy: {
    title: 'Enemies Table',
    body: `Tracks monsters and enemies during combat.

• "+ Monster" searches the 5e SRD and fills in HP, AC and ability scores; "+ Add" creates one by hand
• Tap a row to expand it: HP, temp HP, conditions, exhaustion, ability scores and notes
• "Reset to Default" on a looked-up monster restores its original stats`,
  },
  DiceRoller: {
    title: 'Dice Roller',
    body: `Roll any standard dice with modifiers.

• Tap a die (d4 … d100) to roll it once
• Advantage / Disadvantage: a d20 is rolled twice, keeping the higher / lower result
• Use − / + under the dice to build a pool (e.g. 2d6 + 1d8), then "Roll dice"
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
  AoeDamage: {
    title: 'AoE Damage',
    body: `Apply damage or healing to multiple combatants at once.

• Pick Damage or Heal, then enter an amount
• Tap combatant rows to select them, or use "All Allies" / "All Enemies"
• Per-target modifiers: tap SAVE or RES on any selected row to halve that combatant's damage; tapping both stacks to ¼ (rounded down at each step)
• Hit the big red/green button (or press Enter in the amount field) to apply
• HP updates immediately in every other module; selection clears after applying`,
  },
}

function getInfo(type, config) {
  if (type === 'CombatantTable') {
    return MODULE_INFO[`CombatantTable_${config.tableType ?? 'ally'}`]
  }
  return MODULE_INFO[type] ?? null
}

export default function ModuleWrapper({ id, type, config = {}, minimized, children }) {
  const { removeModule, toggleMinimize } = useLayoutStore(useShallow(s => ({ removeModule: s.removeModule, toggleMinimize: s.toggleMinimize })))
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
        className="flex items-center justify-between flex-shrink-0 select-none"
        style={{
          height: 52,
          padding: '0 var(--sp-3)',
          borderBottom: minimized ? 'none' : '1px solid var(--c-border)',
          background: 'linear-gradient(180deg, var(--c-elevated) 0%, transparent 140%)',
        }}
      >
        {/* Drag handle: grip + title */}
        <div className="drag-handle flex items-center gap-2" style={{ flex: 1, minWidth: 0, cursor: 'grab', height: '100%' }}>
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
              lineHeight: 1,
              transform: 'translateY(2px)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        </div>

        {/* Controls — outside drag handle */}
        <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
          {info && (
            <button
              onClick={() => setInfoOpen(o => !o)}
              title="About this module"
              aria-label="About this module"
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
            aria-label={minimized ? 'Expand' : 'Collapse'}
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >
            {minimized ? '↑' : '↓'}
          </button>
          <button
            onClick={() => removeModule(id)}
            title="Remove"
            aria-label="Remove panel"
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-danger)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >✕</button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div style={{ position: 'absolute', inset: 0, padding: 'var(--sp-3)', overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </div>

          {/* Info overlay */}
          {infoOpen && info && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'var(--c-bg)', overflowY: 'auto', padding: 'var(--sp-4)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-3)' }}>
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
