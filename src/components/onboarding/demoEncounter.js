import { useLayoutStore } from '../../store/layoutStore'
import { useEncounterStore } from '../../store/encounterStore'

// Pre-positioned demo layout. Designed for the 12-col desktop grid:
//   col 0-2:  Initiative (full height)
//   col 3-7:  Allies on top, Enemies underneath
//   col 8-11: Party Manager (full height)
const DEMO_LAYOUT = [
  { type: 'InitiativeTracker', x: 0, y: 0, w: 3, h: 8, config: { __demo: true } },
  { type: 'CombatantTable',    x: 3, y: 0, w: 5, h: 4, config: { tableType: 'ally',  __demo: true } },
  { type: 'CombatantTable',    x: 3, y: 4, w: 5, h: 4, config: { tableType: 'enemy', __demo: true } },
  { type: 'PartyManager',      x: 8, y: 0, w: 4, h: 8, config: { __demo: true } },
]

const DEMO_PARTY = [
  { name: 'Aria the Bold',     type: 'ally',  ac: 17, hp: { current: 32, max: 32, temp: 0 }, initiative: { bonus: 2, roll: 18 }, abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 13 }, _source: 'demo' },
  { name: 'Brennan Stoneoak',  type: 'ally',  ac: 18, hp: { current: 28, max: 28, temp: 0 }, initiative: { bonus: 0, roll: 11 }, abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 13 }, _source: 'demo' },
  { name: 'Lyra Quickfoot',    type: 'ally',  ac: 15, hp: { current: 22, max: 22, temp: 0 }, initiative: { bonus: 4, roll: 21 }, abilities: { str: 10, dex: 18, con: 12, int: 13, wis: 11, cha: 14 }, _source: 'demo' },
  { name: 'Goblin Scout',      type: 'enemy', ac: 13, hp: { current: 7,  max: 7,  temp: 0 }, initiative: { bonus: 2, roll: 14 }, abilities: { str: 8,  dex: 14, con: 10, int: 10, wis: 8,  cha: 8  }, _source: 'demo' },
  { name: 'Goblin Boss',       type: 'enemy', ac: 17, hp: { current: 21, max: 21, temp: 0 }, initiative: { bonus: 2, roll: 9  }, abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8,  cha: 10 }, _source: 'demo' },
]

function moduleSignature(m) {
  if (m.type === 'CombatantTable') return `CombatantTable:${m.config?.tableType ?? 'ally'}`
  return m.type
}

export function seedDemoEncounter() {
  // Idempotent: clear any prior demo data first.
  clearDemoEncounter()

  const layout = useLayoutStore.getState()
  const encounter = useEncounterStore.getState()

  // Filter demo modules the user already has equivalents of, so we never
  // duplicate. Append demo modules with explicit positions instead of using
  // addModule (which always pushes to y: Infinity and stacks them in one column).
  const userSignatures = new Set(layout.modules.map(moduleSignature))
  const userMaxY = layout.modules.reduce(
    (acc, m) => Math.max(acc, (m.y ?? 0) + (m.h ?? 0)),
    0
  )

  const newModules = DEMO_LAYOUT
    .filter(m => !userSignatures.has(moduleSignature(m)))
    .map(m => ({
      i: `${m.type.toLowerCase()}-${crypto.randomUUID().slice(0, 6)}`,
      type: m.type,
      x: m.x,
      y: m.y + userMaxY, // place demo block below any existing user modules
      w: m.w,
      h: m.h,
      config: m.config,
    }))

  layout.setLayout([...layout.modules, ...newModules])

  // Add demo combatants and put them all into initiative order.
  const ids = []
  for (const c of DEMO_PARTY) {
    const id = encounter.addCombatant(c)
    ids.push(id)
  }
  for (const id of ids) encounter.addToInitiative(id)
  encounter.sortInitiative()
}

export function clearDemoEncounter() {
  const layout = useLayoutStore.getState()
  const encounter = useEncounterStore.getState()

  // Remove demo modules
  const demoModuleIds = layout.modules
    .filter(m => m.config?.__demo === true)
    .map(m => m.i)
  for (const id of demoModuleIds) layout.removeModule(id)

  // Remove demo combatants
  const demoCombatantIds = encounter.encounter.combatants
    .filter(c => c._source === 'demo')
    .map(c => c.id)
  for (const id of demoCombatantIds) encounter.removeCombatant(id)
}
