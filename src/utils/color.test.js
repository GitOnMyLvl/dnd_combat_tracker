import { describe, it, expect } from 'vitest'
import { hexToRgba } from './color'

describe('hexToRgba', () => {
  it('converts hex to rgba with alpha', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)')
  })

  it('converts black', () => {
    expect(hexToRgba('#000000', 1)).toBe('rgba(0,0,0,1)')
  })

  it('converts white', () => {
    expect(hexToRgba('#ffffff', 0.14)).toBe('rgba(255,255,255,0.14)')
  })

  it('converts the default accent blue', () => {
    expect(hexToRgba('#60a5fa', 0.14)).toBe('rgba(96,165,250,0.14)')
  })

  it('handles alpha 0', () => {
    expect(hexToRgba('#123456', 0)).toBe('rgba(18,52,86,0)')
  })
})
