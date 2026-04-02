import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const storage = {}
const localStorageMock = {
  getItem: vi.fn((key) => storage[key] ?? null),
  setItem: vi.fn((key, value) => { storage[key] = value }),
  removeItem: vi.fn((key) => { delete storage[key] }),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

// Import after mocks are set up
const { searchMonsters, getMonster } = await import('./open5e')

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(storage).forEach(k => delete storage[k])
})

describe('searchMonsters', () => {
  it('returns empty array for short queries', async () => {
    expect(await searchMonsters('')).toEqual([])
    expect(await searchMonsters('a')).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches from API and returns results', async () => {
    const mockResults = [
      { slug: 'goblin', name: 'Goblin', hit_points: 7 },
      { slug: 'goblin-boss', name: 'Goblin Boss', hit_points: 21 },
    ]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults }),
    })

    const results = await searchMonsters('goblin')
    expect(results).toEqual(mockResults)
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0][0]).toContain('search=goblin')
  })

  it('returns cached results on second call', async () => {
    const mockResults = [{ slug: 'troll', name: 'Troll' }]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults }),
    })

    await searchMonsters('troll')
    const results = await searchMonsters('troll')
    expect(results).toEqual(mockResults)
    expect(fetch).toHaveBeenCalledOnce() // only once, second is cached
  })

  it('throws on API error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(searchMonsters('dragon')).rejects.toThrow('Open5e error: 500')
  })
})

describe('getMonster', () => {
  it('fetches a single monster by slug', async () => {
    const mock = { slug: 'owlbear', name: 'Owlbear', hit_points: 59 }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mock,
    })

    const result = await getMonster('owlbear')
    expect(result).toEqual(mock)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('returns cached monster on second call', async () => {
    const mock = { slug: 'owlbear', name: 'Owlbear' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mock,
    })

    await getMonster('owlbear')
    const result = await getMonster('owlbear')
    expect(result).toEqual(mock)
    expect(fetch).toHaveBeenCalledOnce()
  })
})
