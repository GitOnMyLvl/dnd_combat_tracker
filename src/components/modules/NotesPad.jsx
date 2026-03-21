import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'dnd-tracker-notes'

export default function NotesPad() {
  const [text, setText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [saved, setSaved] = useState(true)

  const save = useCallback((value) => {
    localStorage.setItem(STORAGE_KEY, value)
    setSaved(true)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => save(text), 800)
    return () => clearTimeout(t)
  }, [text, save])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 6 }}>
      <div className="flex items-center justify-between flex-shrink-0">
        <span className="label">Session Notes</span>
        <span style={{ fontSize: '0.68rem', color: saved ? 'var(--c-muted)' : 'var(--c-accent)', transition: 'color 0.2s' }}>
          {saved ? 'Saved' : 'Saving…'}
        </span>
      </div>
      <textarea
        style={{ flex: 1, width: '100%', resize: 'none', fontSize: '0.85rem', lineHeight: 1.6, minHeight: 0 }}
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        placeholder="DM notes, monster descriptions, reminders…"
        spellCheck
      />
    </div>
  )
}
