import { useState } from 'react'
import { useEncounterStore } from '../store/encounterStore'
import { useThemeStore } from '../store/themeStore'
import { useLayoutStore } from '../store/layoutStore'
import { useUIStore } from '../store/uiStore'
import AccentPicker from './AccentPicker'

function D20Icon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5 L21 8 L18 20 L6 20 L3 8 Z" />
      <path d="M12 2.5 L12 12 L3 8 M12 12 L21 8 M12 12 L6 20 M12 12 L18 20" opacity="0.55" />
    </svg>
  )
}

function SunIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

function SaveIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M7 4v5h8V4M7 20v-6h10v6" />
    </svg>
  )
}

function PlusIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function TopBar() {
  const {
    encounter, savedEncounters,
    newEncounter, saveEncounter, loadEncounter, deleteEncounter, renameEncounter,
  } = useEncounterStore()
  const [showEncounters, setShowEncounters] = useState(false)
  const { theme, toggleTheme } = useThemeStore()
  const clearModules = useLayoutStore(s => s.clearModules)
  const openModulePicker = useUIStore(s => s.openModulePicker)
  const [editingName, setEditingName] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  const handleSave = () => {
    saveEncounter()
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1200)
  }

  return (
    <div
      className="flex items-center flex-shrink-0 w-full relative"
      style={{
        height: 56,
        minHeight: 56,
        padding: '0 var(--sp-4)',
        gap: 'var(--sp-2)',
        background: 'linear-gradient(180deg, var(--c-surface) 0%, var(--c-bg) 100%)',
        borderBottom: '1px solid var(--c-border)',
        boxShadow: '0 1px 0 var(--c-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center" style={{ gap: 10, flexShrink: 0 }}>
        <span style={{ color: 'var(--c-accent)', display: 'flex' }}>
          <D20Icon size={22} />
        </span>
        <span
          className="display"
          style={{
            fontSize: '0.95rem',
            color: 'var(--c-text)',
            letterSpacing: '0.18em',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          BATTLE TRACKER
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--c-border)', flexShrink: 0, margin: '0 var(--sp-1)' }} />

      {/* Encounter name */}
      {editingName ? (
        <input
          autoFocus
          value={encounter.name}
          onChange={e => renameEncounter(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false) }}
          style={{ minHeight: 32, width: 180, fontSize: '0.85rem', padding: '4px 8px' }}
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          title="Click to rename"
          style={{
            background: 'none', border: '1px solid transparent', minHeight: 32, minWidth: 'unset',
            fontSize: '0.9rem', color: 'var(--c-text)', fontWeight: 500, padding: '0 10px',
            borderRadius: 6, flexShrink: 1, maxWidth: 220,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-display)', letterSpacing: '0.03em',
            transition: 'background 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-elevated)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' }}
        >{encounter.name}</button>
      )}

      <div style={{ flex: 1 }} />

      {/* Add Module button */}
      <button
        onClick={openModulePicker}
        className="btn-primary"
        style={{ minHeight: 34, minWidth: 'unset', padding: '0 14px', fontSize: '0.8rem', flexShrink: 0, gap: 6, display: 'inline-flex', alignItems: 'center' }}
      >
        <PlusIcon /> Module
      </button>

      <div style={{ width: 1, height: 22, background: 'var(--c-border)', flexShrink: 0, margin: '0 var(--sp-1)' }} />

      {/* Save */}
      <button
        onClick={handleSave}
        className="btn-ghost"
        title="Save encounter"
        style={{
          minHeight: 34, minWidth: 'unset',
          color: saveFlash ? 'var(--c-success)' : undefined,
          borderColor: saveFlash ? 'var(--c-success)' : undefined,
          flexShrink: 0,
        }}
      >
        {saveFlash ? '✓' : <SaveIcon />}
        <span>{saveFlash ? 'Saved' : 'Save'}</span>
      </button>

      {/* Encounters */}
      <button
        onClick={() => setShowEncounters(v => !v)}
        className="btn-ghost"
        style={{
          minHeight: 34, minWidth: 'unset',
          background: showEncounters ? 'var(--c-elevated)' : undefined,
          flexShrink: 0,
        }}
      >
        Encounters
        {savedEncounters.length > 0 && (
          <span style={{
            background: 'var(--c-accent-soft)',
            color: 'var(--c-accent)',
            borderRadius: 10, padding: '1px 7px',
            fontSize: '0.68rem', marginLeft: 4,
            fontWeight: 700,
          }}>
            {savedEncounters.length}
          </span>
        )}
      </button>

      {/* New */}
      <button
        onClick={() => { if (window.confirm('Start a new encounter? Unsaved changes will be lost.')) { newEncounter(); clearModules() } }}
        className="btn-ghost"
        style={{ minHeight: 34, minWidth: 'unset', flexShrink: 0 }}
      >New</button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn-ghost"
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-label="Toggle theme"
        style={{ minHeight: 34, minWidth: 34, padding: '0 9px', flexShrink: 0 }}
      >{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>

      <AccentPicker />

      {/* Encounters dropdown */}
      {showEncounters && (
        <div
          className="card"
          style={{
            position: 'absolute', top: 62, right: 'var(--sp-3)', zIndex: 50,
            width: 300, padding: 'var(--sp-3)',
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          <div className="label" style={{ marginBottom: 'var(--sp-2)' }}>Saved Encounters</div>
          {savedEncounters.length === 0 && (
            <p style={{ color: 'var(--c-muted)', fontSize: '0.82rem', padding: '8px 0', fontStyle: 'italic' }}>
              No saved encounters yet.
            </p>
          )}
          <div className="flex flex-col" style={{ gap: 'var(--sp-1)' }}>
            {savedEncounters.map(e => (
              <div key={e.id} className="flex items-center" style={{ gap: 6 }}>
                <button
                  onClick={() => { loadEncounter(e.id); setShowEncounters(false) }}
                  style={{
                    flex: 1, textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                    background: 'var(--c-elevated)', border: '1px solid var(--c-border)',
                    minHeight: 44, minWidth: 'unset', transition: 'background 0.12s, border-color 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-hover)'; e.currentTarget.style.borderColor = 'var(--c-border-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-elevated)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{e.name}</div>
                  <div style={{ color: 'var(--c-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                    {e.combatants?.length ?? 0} combatants · Round {e.round}
                  </div>
                </button>
                <button
                  onClick={() => deleteEncounter(e.id)}
                  className="btn-danger"
                  style={{ minHeight: 36, minWidth: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
