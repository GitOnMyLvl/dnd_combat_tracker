export const ABILITY_LABELS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(score) {
  const m = abilityModifier(score)
  return m >= 0 ? `+${m}` : `${m}`
}
