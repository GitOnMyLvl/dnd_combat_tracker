export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Simple parser: matches a single NdN+M expression.
 * Used for basic validation/testing.
 */
export function parseExpression(expr) {
  const match = expr.trim().replace(/\s/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i)
  if (!match) return null
  return {
    count: parseInt(match[1] || '1', 10),
    sides: parseInt(match[2], 10),
    mod: match[3] ? parseInt(match[3], 10) : 0,
  }
}

/**
 * Multi-term expression parser and roller.
 * Supports expressions like "2d6+3+4d8+7" or "d20-1".
 * Returns { total, breakdown } or null if invalid.
 */
export function parseAndRoll(expr) {
  const clean = expr.trim().replace(/\s+/g, '')
  if (!clean) return null
  // Validate: after stripping all valid terms, nothing should remain
  if (clean.replace(/[+-]?(\d*d\d+|\d+)/gi, '').length > 0) return null

  const termRegex = /([+-]?)(\d*d\d+|\d+)/gi
  const terms = []
  let m
  while ((m = termRegex.exec(clean)) !== null) {
    const sign = m[1] === '-' ? -1 : 1
    const dm = m[2].match(/^(\d*)d(\d+)$/i)
    if (dm) {
      terms.push({ type: 'dice', sign, count: parseInt(dm[1] || '1', 10), sides: parseInt(dm[2], 10) })
    } else {
      terms.push({ type: 'flat', sign, value: parseInt(m[2], 10) })
    }
  }
  if (terms.length === 0) return null

  let total = 0
  const parts = []
  for (let i = 0; i < terms.length; i++) {
    const t = terms[i]
    const prefix = i === 0 ? (t.sign === -1 ? '-' : '') : (t.sign === -1 ? ' - ' : ' + ')
    if (t.type === 'dice') {
      const rolls = Array.from({ length: t.count }, () => rollDie(t.sides))
      total += rolls.reduce((a, b) => a + b, 0) * t.sign
      parts.push(`${prefix}${t.count === 1 ? '' : t.count}d${t.sides}[${rolls.join(',')}]`)
    } else {
      total += t.sign * t.value
      parts.push(`${prefix}${t.value}`)
    }
  }
  return { total, breakdown: parts.join('') }
}
