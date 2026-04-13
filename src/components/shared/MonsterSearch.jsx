import { useState, useRef, useEffect } from 'react'
import { searchMonsters } from '../../api/open5e'
import { useEncounterStore, mapApiToCombatant } from '../../store/encounterStore'

export default function MonsterSearch({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const addCombatant = useEncounterStore(s => s.addCombatant)
  const debounceRef = useRef(null)

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const handleSearch = (value) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchMonsters(value)
        setResults(data)
      } catch {
        setError('Could not reach Open5e. Check your connection.')
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const addMonster = (monster) => {
    addCombatant({
      ...mapApiToCombatant(monster),
      type: 'enemy',
      _source: 'api',
      _apiData: monster,
    })
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <input
        autoFocus
        type="text"
        placeholder="Search monsters…"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        style={{ minHeight: 44, fontSize: '0.95rem' }}
      />

      {loading && <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>Searching…</p>}
      {error && <p style={{ color: 'var(--c-danger)', fontSize: '0.8rem' }}>{error}</p>}

      {results.length > 0 && (
        <ul className="flex flex-col" style={{ gap: 4, maxHeight: 280, overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
          {results.map(m => (
            <li key={m.slug}>
              <button
                onClick={() => addMonster(m)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--c-elevated)', border: '1px solid var(--c-border)',
                  textAlign: 'left', minHeight: 48, minWidth: 'unset',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--c-elevated)'}
              >
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</span>
                <span style={{ color: 'var(--c-muted)', fontSize: '0.75rem' }}>
                  AC {m.armor_class} · HP {m.hit_points} · CR {m.challenge_rating}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
        <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>No monsters found.</p>
      )}
    </div>
  )
}
