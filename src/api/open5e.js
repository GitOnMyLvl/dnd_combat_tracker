const BASE = 'https://api.open5e.com/v1'
const CACHE_PREFIX = 'open5e_monster_'
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7 // 7 days

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // Storage full — ignore
  }
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
