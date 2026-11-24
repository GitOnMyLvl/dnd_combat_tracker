const BASE = 'https://api.open5e.com/v1'
const CACHE_PREFIX = 'open5e_monster_'
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7 // 7 days

// localStorage is shared with the persisted encounters/characters (≈5 MB
// total), so the monster cache is capped. Keys are tracked oldest-first in an
// index; the oldest entries are evicted beyond MAX_ENTRIES or on a quota error.
const INDEX_KEY = CACHE_PREFIX + 'index'
const MAX_ENTRIES = 150

function readIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    const index = raw ? JSON.parse(raw) : []
    return Array.isArray(index) ? index : []
  } catch {
    return []
  }
}

function writeIndex(index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  } catch {
    // ignore
  }
}

function evict(index, count) {
  index.splice(0, count).forEach(k => {
    try { localStorage.removeItem(CACHE_PREFIX + k) } catch { /* ignore */ }
  })
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key)
      writeIndex(readIndex().filter(k => k !== key))
      return null
    }
    return data
  } catch {
    return null
  }
}

function cacheSet(key, data) {
  const index = readIndex().filter(k => k !== key)
  const value = JSON.stringify({ data, ts: Date.now() })
  // Retry after evicting the oldest half if storage is full.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, value)
      index.push(key)
      if (index.length > MAX_ENTRIES) evict(index, index.length - MAX_ENTRIES)
      writeIndex(index)
      return
    } catch {
      if (index.length === 0) return
      evict(index, Math.ceil(index.length / 2))
    }
  }
  writeIndex(index)
}

export async function searchMonsters(query) {
  if (!query || query.trim().length < 2) return []

  const cacheKey = `search_${query.trim().toLowerCase()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const url = `${BASE}/monsters/?search=${encodeURIComponent(query)}&limit=10&document__slug__in=wotc-srd`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open5e error: ${res.status}`)
  const json = await res.json()
  const results = json.results ?? []

  cacheSet(cacheKey, results)
  // Also cache individual monsters
  results.forEach(m => cacheSet(`slug_${m.slug}`, m))

  return results
}

export async function getMonster(slug) {
  const cached = cacheGet(`slug_${slug}`)
  if (cached) return cached

  const res = await fetch(`${BASE}/monsters/${slug}/`)
  if (!res.ok) throw new Error(`Open5e error: ${res.status}`)
  const data = await res.json()
  cacheSet(`slug_${slug}`, data)
  return data
}
