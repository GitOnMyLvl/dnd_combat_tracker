import { describe, it, expect } from 'vitest'
import { rollDie, parseExpression, parseAndRoll } from './dice'

describe('rollDie', () => {
  it('returns a number between 1 and sides (inclusive)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(20)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(20)
    }
  })

  it('works for d6', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollDie(6)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    }
  })

  it('works for d100', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollDie(100)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(100)
    }
  })
})

describe('parseExpression', () => {
  it('parses simple die expression', () => {
    expect(parseExpression('d20')).toEqual({ count: 1, sides: 20, mod: 0 })
  })

  it('parses multi-dice expression', () => {
    expect(parseExpression('3d6')).toEqual({ count: 3, sides: 6, mod: 0 })
  })

  it('parses expression with positive modifier', () => {
    expect(parseExpression('2d8+5')).toEqual({ count: 2, sides: 8, mod: 5 })
  })

  it('parses expression with negative modifier', () => {
    expect(parseExpression('1d20-2')).toEqual({ count: 1, sides: 20, mod: -2 })
  })

  it('handles whitespace', () => {
    expect(parseExpression('  2d6 + 3  ')).toEqual({ count: 2, sides: 6, mod: 3 })
  })

  it('is case-insensitive', () => {
    expect(parseExpression('2D10')).toEqual({ count: 2, sides: 10, mod: 0 })
  })

  it('returns null for invalid expressions', () => {
    expect(parseExpression('foo')).toBeNull()
    expect(parseExpression('')).toBeNull()
    expect(parseExpression('2+3')).toBeNull()
    expect(parseExpression('dd20')).toBeNull()
  })

  it('parses d4', () => {
    expect(parseExpression('d4')).toEqual({ count: 1, sides: 4, mod: 0 })
  })

  it('parses 10d10+10', () => {
    expect(parseExpression('10d10+10')).toEqual({ count: 10, sides: 10, mod: 10 })
  })
})

describe('parseAndRoll', () => {
  it('returns null for empty input', () => {
    expect(parseAndRoll('')).toBeNull()
    expect(parseAndRoll('   ')).toBeNull()
  })

  it('returns null for invalid expressions', () => {
    expect(parseAndRoll('foo')).toBeNull()
    expect(parseAndRoll('abc+def')).toBeNull()
  })

  it('rolls a simple die expression', () => {
    const result = parseAndRoll('d20')
    expect(result).not.toBeNull()
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
    expect(result.breakdown).toMatch(/d20\[\d+\]/)
  })

  it('rolls multi-dice expression', () => {
    const result = parseAndRoll('2d6')
    expect(result).not.toBeNull()
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.total).toBeLessThanOrEqual(12)
    expect(result.breakdown).toMatch(/2d6\[\d+,\d+\]/)
  })

  it('handles flat modifiers', () => {
    const result = parseAndRoll('1d1+5')
    expect(result).not.toBeNull()
    expect(result.total).toBe(6) // 1d1 always = 1, +5 = 6
  })

  it('handles negative modifiers', () => {
    const result = parseAndRoll('1d1-1')
    expect(result).not.toBeNull()
    expect(result.total).toBe(0) // 1 - 1 = 0
  })

  it('handles multi-term expressions like 2d6+3+4d8+7', () => {
    const result = parseAndRoll('2d6+3+4d8+7')
    expect(result).not.toBeNull()
    // min: 2+3+4+7=16, max: 12+3+32+7=54
    expect(result.total).toBeGreaterThanOrEqual(16)
    expect(result.total).toBeLessThanOrEqual(54)
  })

  it('handles flat-only expressions', () => {
    const result = parseAndRoll('5')
    expect(result).not.toBeNull()
    expect(result.total).toBe(5)
  })

  it('handles subtraction terms', () => {
    const result = parseAndRoll('1d1+10-3')
    expect(result).not.toBeNull()
    expect(result.total).toBe(8) // 1 + 10 - 3
  })
})
