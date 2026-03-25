export const CONDITIONS = [
  { name: 'Blinded',       color: '#52525b', desc: 'Auto-fail sight checks, attacks at disadv.' },
  { name: 'Charmed',       color: '#be185d', desc: 'Can\'t attack charmer, adv on charmer\'s social' },
  { name: 'Dazed',         color: '#b45309', desc: 'Can use action or bonus action, not both. No reactions.' },
  { name: 'Deafened',      color: '#52525b', desc: 'Auto-fail hearing checks' },
  { name: 'Frightened',    color: '#6d28d9', desc: 'Disadv while source is visible' },
  { name: 'Grappled',      color: '#92400e', desc: 'Speed 0' },
  { name: 'Incapacitated', color: '#b91c1c', desc: 'No actions or reactions' },
  { name: 'Invisible',     color: '#71717a', desc: 'Attacks against disadv, attacks with adv' },
  { name: 'Paralyzed',     color: '#b91c1c', desc: 'Incapacitated + auto-fail Str/Dex saves' },
  { name: 'Petrified',     color: '#57534e', desc: 'Stone, incapacitated, resistant all' },
  { name: 'Poisoned',      color: '#15803d', desc: 'Disadv on attacks and ability checks' },
  { name: 'Prone',         color: '#92400e', desc: 'Melee adv against, ranged disadv against' },
  { name: 'Restrained',    color: '#7c2d12', desc: 'Speed 0, attacks against adv, own disadv' },
  { name: 'Stunned',       color: '#b91c1c', desc: 'Incapacitated + auto-fail Str/Dex' },
  { name: 'Unconscious',   color: '#1e40af', desc: 'Incapacitated + prone, crits within 5ft' },
  { name: 'Concentration', color: '#d97706', desc: 'Currently concentrating on a spell' },
]

export const CONDITION_NAMES = CONDITIONS.map(c => c.name)

export const CONDITION_MAP = Object.fromEntries(CONDITIONS.map(c => [c.name, c]))
