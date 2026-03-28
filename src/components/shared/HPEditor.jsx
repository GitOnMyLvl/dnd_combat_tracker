import { useState } from 'react'
import { useEncounterStore } from '../../store/encounterStore'

export default function HPEditor({ combatant }) {
  const { updateHP, setHP, updateCombatant } = useEncounterStore()
  const [inputVal, setInputVal] = useState('')
  const [hpDraft, setHpDraft] = useState(null) // null = not editing
  const [maxHpDraft, setMaxHpDraft] = useState(null) // null = not editing
  const { hp } = combatant

  const commitHP = () => {
    if (hpDraft !== null) {
      if (hpDraft !== '') {
        const n = parseInt(hpDraft, 10)
        if (!isNaN(n)) setHP(combatant.id, n)
      }
      setHpDraft(null)
    }
  }

  const commitMaxHP = () => {
    if (maxHpDraft !== null) {
      if (maxHpDraft !== '') {
        const n = parseInt(maxHpDraft, 10)
        if (!isNaN(n) && n > 0) {
          const current = Math.min(hp.current, n)
          updateCombatant(combatant.id, { hp: { ...hp, max: n, current } })
        }
      }
      setMaxHpDraft(null)
    }
  }

  const pct = hp.max > 0 ? hp.current / hp.max : 0
  const barColor = pct > 0.5 ? 'var(--c-success)' : pct > 0.25 ? 'var(--c-accent)' : 'var(--c-danger)'

  const applyInput = (action) => {
    const n = parseInt(inputVal, 10)
    if (isNaN(n) || n <= 0) return
    if (action === 'dmg') updateHP(combatant.id, -n)
    else if (action === 'heal') updateHP(combatant.id, n)
    else if (action === 'temp') updateCombatant(combatant.id, { hp: { ...hp, temp: n } })
    setInputVal('')
  }

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {/* Bar */}
      <div style={{ height: 5, borderRadius: 3, background: 'var(--c-elevated)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct * 100}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s, background 0.3s' }} />
        {hp.temp > 0 && (
          <div style={{ position: 'absolute', top: 0, height: '100%', left: `${pct * 100}%`, width: `${Math.min((hp.temp / hp.max) * 100, 100 - pct * 100)}%`, background: '#60a5fa', opacity: 0.7 }} />
        )}
      </div>

      {/* HP inputs */}
      <div className="flex items-center" style={{ gap: 6 }}>
        <input
          type="text"
          inputMode="numeric"
          value={hpDraft !== null ? hpDraft : hp.current}
          onChange={e => setHpDraft(e.target.value)}
          onBlur={commitHP}
          onKeyDown={e => { if (e.key === 'Enter') commitHP() }}
          style={{ width: 52, textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', minHeight: 36, padding: '2px 4px' }}
        />
        <span style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>/</span>
        <input
          type="text"
          inputMode="numeric"
          value={maxHpDraft !== null ? maxHpDraft : hp.max}
          onChange={e => setMaxHpDraft(e.target.value)}
          onBlur={commitMaxHP}
          onKeyDown={e => { if (e.key === 'Enter') commitMaxHP() }}
          style={{ width: 52, textAlign: 'center', color: 'var(--c-muted2)', minHeight: 36, padding: '2px 4px' }}
        />
        {hp.temp > 0 && (
          <span style={{ fontSize: '0.72rem', color: '#60a5fa', marginLeft: 2 }}>+{hp.temp} tmp</span>
        )}
      </div>

      {/* DMG / HEAL */}
      <div className="flex items-center" style={{ gap: 5 }}>
        <input
          type="number"
          min={1}
          placeholder="Amount"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyInput('dmg')}
          style={{ flex: 1, minHeight: 36, padding: '2px 8px' }}
        />
        <button
          onClick={() => applyInput('dmg')}
          style={{ background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)', borderRadius: 7, padding: '0 10px', minHeight: 36, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600 }}
        >DMG</button>
        <button
          onClick={() => applyInput('heal')}
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid var(--c-success)', color: 'var(--c-success)', borderRadius: 7, padding: '0 10px', minHeight: 36, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600 }}
        >HEAL</button>
        <button
          onClick={() => applyInput('temp')}
          style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: 7, padding: '0 10px', minHeight: 36, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600 }}
        >TMP</button>
      </div>
    </div>
  )
}
