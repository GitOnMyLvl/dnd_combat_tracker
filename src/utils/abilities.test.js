import { describe, it, expect } from 'vitest'
import { ABILITY_LABELS, abilityModifier, formatModifier } from './abilities'

describe('ABILITY_LABELS', () => {
  it('contains all six abilities', () => {
    expect(ABILITY_LABELS).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha'])
  })
})

describe('abilityModifier', () => {
  it('calculates modifier for score 10 (0)', () => {
    expect(abilityModifier(10)).toBe(0)
  })

  it('calculates modifier for score 11 (0)', () => {
    expect(abilityModifier(11)).toBe(0)
  })

  it('calculates modifier for score 20 (+5)', () => {
    expect(abilityModifier(20)).toBe(5)
  })

  it('calculates modifier for score 8 (-1)', () => {
    expect(abilityModifier(8)).toBe(-1)
  })

  it('calculates modifier for score 1 (-5)', () => {
    expect(abilityModifier(1)).toBe(-5)
  })

  it('calculates modifier for score 14 (+2)', () => {
    expect(abilityModifier(14)).toBe(2)
  })

  it('calculates modifier for score 15 (+2)', () => {
    expect(abilityModifier(15)).toBe(2)
  })
})

describe('formatModifier', () => {
  it('formats positive modifier with +', () => {
    expect(formatModifier(14)).toBe('+2')
  })

  it('formats zero modifier with +', () => {
    expect(formatModifier(10)).toBe('+0')
  })

  it('formats negative modifier with -', () => {
    expect(formatModifier(8)).toBe('-1')
  })
})
