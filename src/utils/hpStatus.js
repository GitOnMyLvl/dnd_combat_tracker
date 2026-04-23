export function getHpStatus(hp) {
  const dying = hp.current === 0
  const bloodied = !dying && hp.current <= Math.floor(hp.max / 2)
  const color = dying ? 'var(--c-danger)' : bloodied ? '#f97316' : 'var(--c-text)'
  return { dying, bloodied, color }
}
