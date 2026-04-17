import { useEffect } from 'react'
import { MODULE_COMPONENTS } from './canvas/Canvas'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { applyTheme, applyAccent, useThemeStore } from '../store/themeStore'

const MODULE_TITLES = {
  InitiativeTracker: 'Initiative',
  CombatantTable: 'Combatants',
  ConditionsPanel: 'Conditions',
  DiceRoller: 'Dice',
  NotesPad: 'Notes',
  PartyManager: 'Party',
}

export default function PopoutApp({ type, config }) {
  const Component = MODULE_COMPONENTS[type]

  useEffect(() => {
    const title = MODULE_TITLES[type] ?? type
    document.title = `${title} — D&D Battle Tracker`
  }, [type])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'dnd-tracker-encounter') {
        useEncounterStore.persist.rehydrate()
      } else if (e.key === 'dnd-tracker-characters') {
        useCharacterStore.persist.rehydrate()
      } else if (e.key === 'dnd-tracker-theme' && e.newValue) {
        applyTheme(e.newValue)
        useThemeStore.setState({ theme: e.newValue })
      } else if (e.key === 'dnd-tracker-accent' && e.newValue) {
        applyAccent(e.newValue)
        useThemeStore.setState({ accent: e.newValue })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') window.close() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const btnStyle = {
    position: 'fixed', top: 8, right: 8, zIndex: 50,
    height: 36, width: 36, minHeight: 36, minWidth: 36,
    background: 'none', border: 'none',
    color: 'var(--c-muted)', fontSize: '0.85rem',
    borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  if (!Component) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)', color: 'var(--c-text)', gap: 12 }}>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>Unknown module: <strong>{type}</strong></p>
        <button style={btnStyle} onClick={() => window.close()} aria-label="Close pop-out">✕</button>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)', color: 'var(--c-text)', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        <Component config={config} />
      </div>
      {/* One-way sync notice */}
      <div style={{ flexShrink: 0, padding: '4px 12px 6px', borderTop: '1px solid var(--c-border)', fontSize: '0.7rem', color: 'var(--c-muted)', textAlign: 'center' }}>
        Edits here won't sync back — edit in the main window
      </div>
      <button
        style={btnStyle}
        onClick={() => window.close()}
        aria-label="Close pop-out"
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
      >✕</button>
    </div>
  )
}
