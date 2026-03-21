import { useState } from 'react'
import { useEncounterStore } from '../store/encounterStore'
import { useThemeStore } from '../store/themeStore'
import { useLayoutStore } from '../store/layoutStore'
import { openModulePicker } from './canvas/Canvas'
import AccentPicker from './AccentPicker'

export default function TopBar() {
  const {
    encounter, savedEncounters,
    newEncounter, saveEncounter, loadEncounter, deleteEncounter, renameEncounter,
  } = useEncounterStore()
  const [showEncounters, setShowEncounters] = useState(false)
  const { theme, toggleTheme } = useThemeStore()
  const clearModules = useLayoutStore(s => s.clearModules)
  const [editingName, setEditingName] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  const handleSave = () => {
    saveEncounter()
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1200)
  }

  return (
    <div
      className="flex items-center gap-2 px-4 flex-shrink-0 w-full relative"
      style={{ height: 52, minHeight: 52, background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
    >
      {/* Logo */}
      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-accent)', letterSpacing: '0.06em', flexShrink: 0 }}>
        COMBAT TRACKER
      </span>

      <div style={{ width: 1, height: 20, background: 'var(--c-border)', flexShrink: 0, margin: '0 4px' }} />

      {/* Encounter name */}
      {editingName ? (
        <input
          autoFocus
          value={encounter.name}
          onChange={e => renameEncounter(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false) }}
          style={{ minHeight: 32, width: 160, fontSize: '0.85rem', padding: '4px 8px' }}
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          title="Click to rename"
          style={{
            background: 'none', border: 'none', minHeight: 32, minWidth: 'unset',
            fontSize: '0.85rem', color: 'var(--c-text)', fontWeight: 500, padding: '0 6px',
            borderRadius: 6, flexShrink: 1, maxWidth: 200,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--c-elevated)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >{encounter.name}</button>
      )}

      <div style={{ flex: 1 }} />

      {/* Add Module button */}
      <button
        onClick={() => openModulePicker()}
        className="btn-primary"
        style={{ minHeight: 32, minWidth: 'unset', padding: '0 14px', fontSize: '0.8rem', flexShrink: 0 }}
      >+ Module</button>

      <div style={{ width: 1, height: 20, background: 'var(--c-border)', flexShrink: 0, margin: '0 4px' }} />

      {/* Save */}
      <button
        onClick={handleSave}
        className="btn-ghost"
        style={{
          minHeight: 32, minWidth: 'unset',
          color: saveFlash ? 'var(--c-success)' : undefined,
          borderColor: saveFlash ? 'var(--c-success)' : undefined,
          flexShrink: 0,
        }}
      >{saveFlash ? '✓ Saved' : 'Save'}</button>

      {/* Encounters */}
      <button
        onClick={() => setShowEncounters(v => !v)}
        className="btn-ghost"
        style={{
          minHeight: 32, minWidth: 'unset',
          background: showEncounters ? 'var(--c-elevated)' : undefined,
          flexShrink: 0,
        }}
      >
        Encounters
        {savedEncounters.length > 0 && (
          <span style={{ background: 'var(--c-elevated)', borderRadius: 10, padding: '1px 6px', fontSize: '0.68rem', marginLeft: 5, color: 'var(--c-muted2)' }}>
            {savedEncounters.length}
          </span>
        )}
      </button>

      {/* New */}
      <button
        onClick={() => { if (window.confirm('Start a new encounter? Unsaved changes will be lost.')) { newEncounter(); clearModules() } }}
        className="btn-ghost"
        style={{ minHeight: 32, minWidth: 'unset', flexShrink: 0 }}
      >New</button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn-ghost"
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        style={{ minHeight: 32, minWidth: 32, padding: '0 8px', flexShrink: 0, fontSize: '0.8rem' }}
      >{theme === 'dark' ? 'Light' : 'Dark'}</button>

      <AccentPicker />

      {/* Encounters dropdown */}
      {showEncounters && (
        <div
          className="card"
          style={{
            position: 'absolute', top: 58, right: 12, zIndex: 50,
            width: 280, padding: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <div className="label" style={{ marginBottom: 8 }}>Saved Encounters</div>
          {savedEncounters.length === 0 && (
            <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem', padding: '8px 0' }}>No saved encounters yet.</p>
          )}
          <div className="flex flex-col" style={{ gap: 4 }}>
            {savedEncounters.map(e => (
              <div key={e.id} className="flex items-center" style={{ gap: 6 }}>
                <button
                  onClick={() => { loadEncounter(e.id); setShowEncounters(false) }}
                  style={{
                    flex: 1, textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                    background: 'var(--c-elevated)', border: '1px solid var(--c-border)',
                    minHeight: 44, minWidth: 'unset', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--c-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--c-elevated)'}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.name}</div>
                  <div style={{ color: 'var(--c-muted)', fontSize: '0.72rem', marginTop: 1 }}>
                    {e.combatants?.length ?? 0} combatants · Round {e.round}
                  </div>
                </button>
                <button
                  onClick={() => deleteEncounter(e.id)}
                  className="btn-danger"
                  style={{ minHeight: 36, minWidth: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete"
                >x</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
