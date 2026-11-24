import { describe, it, expect } from 'vitest'
import { useLayoutStore } from './layoutStore'

describe('layoutStore', () => {
  it('drops the removed Conditions module from saved layouts', () => {
    const { migrate } = useLayoutStore.persist.getOptions()
    const migrated = migrate({
      modules: [
        { i: 'a', type: 'InitiativeTracker' },
        { i: 'b', type: 'ConditionsPanel' },
      ],
    }, 0)
    expect(migrated.modules.map(m => m.type)).toEqual(['InitiativeTracker'])
  })

  it('applies a default layout with initiative, both tables and dice', () => {
    useLayoutStore.getState().applyDefaultLayout()
    const types = useLayoutStore.getState().modules.map(m => m.config.tableType ?? m.type)
    expect(types).toEqual(['InitiativeTracker', 'enemy', 'ally', 'DiceRoller'])
  })
})
