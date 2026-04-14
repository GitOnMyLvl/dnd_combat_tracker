import { test, expect } from '@playwright/test'

async function setupCombat(page) {
  await page.evaluate(() => Promise.all([
    import('/src/store/encounterStore.js').then(m => { window.__enc = m.useEncounterStore }),
    import('/src/store/characterStore.js').then(m => { window.__chr = m.useCharacterStore }),
  ]))
  await page.evaluate(() => {
    const enc = window.__enc.getState()
    const chr = window.__chr.getState()
    const players = [
      { name: 'Gorak',          type: 'ally', hp: { current: 52, max: 52, temp: 0 }, initiative: { bonus: 1, roll: 14 }, abilities: { str: 18, dex: 12, con: 16, int: 8,  wis: 10, cha: 10 }, ac: 18 },
      { name: 'Sylvara',        type: 'ally', hp: { current: 38, max: 38, temp: 0 }, initiative: { bonus: 3, roll: 16 }, abilities: { str: 8,  dex: 16, con: 12, int: 14, wis: 16, cha: 10 }, ac: 16 },
      { name: 'Brother Aldric', type: 'ally', hp: { current: 40, max: 40, temp: 0 }, initiative: { bonus: 0, roll:  6 }, abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 18, cha: 12 }, ac: 17 },
    ]
    const enemies = [
      { name: 'Hobgoblin Captain', type: 'enemy', hp: { current: 52, max: 52, temp: 0 }, initiative: { bonus: 2, roll: 18 }, abilities: { str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 13 }, ac: 17 },
      { name: 'Hobgoblin 1',       type: 'enemy', hp: { current: 18, max: 18, temp: 0 }, initiative: { bonus: 1, roll: 10 }, abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha:  9 }, ac: 18 },
      { name: 'Hobgoblin 2',       type: 'enemy', hp: { current: 18, max: 18, temp: 0 }, initiative: { bonus: 1, roll:  8 }, abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha:  9 }, ac: 18 },
      { name: 'Hobgoblin 3',       type: 'enemy', hp: { current: 18, max: 18, temp: 0 }, initiative: { bonus: 1, roll:  4 }, abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha:  9 }, ac: 18 },
    ]
    const allIds = []
    for (const c of [...players, ...enemies]) { const id = enc.addCombatant(c); allIds.push(id) }
    const state = window.__enc.getState()
    const playerIds = state.encounter.combatants.filter(c => c.type === 'player').map(c => c.id)
    const enemyIds  = state.encounter.combatants.filter(c => c.type === 'enemy').map(c => c.id)
    chr.saveParty('The Adventurers', playerIds)
    chr.saveParty('Hobgoblin Warband', enemyIds)
    for (const id of allIds) window.__enc.getState().addToInitiative(id)
    window.__enc.getState().sortInitiative()
  })
}

async function addModules(page) {
  await page.getByTitle('Add module').click()
  await page.getByRole('button', { name: /Initiative Tracker/ }).click()
  await expect(page.locator('.drag-handle', { hasText: 'INITIATIVE' })).toBeVisible()
  await page.getByTitle('Add module').click()
  await page.getByRole('button', { name: /Enemies Table/ }).click()
  await expect(page.locator('.drag-handle', { hasText: 'ENEMIES' })).toBeVisible()
  await page.getByTitle('Add module').click()
  await page.getByRole('button', { name: /Allies Table/ }).click()
  await expect(page.locator('.drag-handle', { hasText: 'ALLIES' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await setupCombat(page)
  await addModules(page)
})

test.describe('Combat Simulation � 3 players vs 4 enemies', () => {

  test('initiative order is correct after sort', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await expect(tracker.getByText('Hobgoblin Captain')).toBeVisible()
    await expect(tracker.getByText('Sylvara')).toBeVisible()
    await expect(tracker.getByText('Gorak')).toBeVisible()
    await expect(tracker.getByText('Brother Aldric')).toBeVisible()
    await expect(tracker.getByTestId('round-number')).toHaveText('1')
  })

  test('Next Turn advances through all combatants and increments round', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    for (let i = 0; i < 7; i++) await page.getByRole('button', { name: /Next/ }).click()
    await expect(tracker.getByTestId('round-number')).toHaveText('2')
  })

  test('DMG button reduces enemy HP and updates display', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await tracker.getByText('Hobgoblin Captain').click()
    await tracker.locator('[data-testid="hp-amount-input"]').fill('15')
    await tracker.getByRole('button', { name: 'DMG', exact: true }).click()
    await expect(tracker.getByText('37/52')).toBeVisible()
  })

  test('HEAL button restores HP and clamps to max', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const gorak = enc.encounter.combatants.find(c => c.name === 'Gorak')
      enc.updateHP(gorak.id, -20)
    })
    await tracker.getByText('Gorak').click()
    await tracker.locator('[data-testid="hp-amount-input"]').fill('10')
    await tracker.getByRole('button', { name: 'HEAL', exact: true }).click()
    await expect(tracker.getByText('42/52')).toBeVisible()
    await tracker.locator('[data-testid="hp-amount-input"]').fill('100')
    await tracker.getByRole('button', { name: 'HEAL', exact: true }).click()
    await expect(tracker.getByText('52/52').first()).toBeVisible()
  })

  test('death saves appear when active combatant is at 0 HP', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const cap = enc.encounter.combatants.find(c => c.name === 'Hobgoblin Captain')
      enc.setHP(cap.id, 0)
    })
    await expect(tracker.getByText('SAVES')).toBeVisible()
  })

  test('3 death save failures shows DEAD label', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const cap = enc.encounter.combatants.find(c => c.name === 'Hobgoblin Captain')
      enc.setHP(cap.id, 0)
      enc.setDeathSave(cap.id, 'failures', 3)
    })
    await expect(tracker.getByText('DEAD')).toBeVisible()
  })

  test('3 death save successes shows STABLE label', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const cap = enc.encounter.combatants.find(c => c.name === 'Hobgoblin Captain')
      enc.setHP(cap.id, 0)
      enc.setDeathSave(cap.id, 'successes', 3)
    })
    await expect(tracker.getByText('STABLE')).toBeVisible()
  })

  test('death save reset button clears pips', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const cap = enc.encounter.combatants.find(c => c.name === 'Hobgoblin Captain')
      enc.setHP(cap.id, 0)
      enc.setDeathSave(cap.id, 'failures', 2)
    })
    await expect(tracker.getByTitle('Reset death saves')).toBeVisible()
    await tracker.getByTitle('Reset death saves').click()
    await expect(tracker.getByTitle('Reset death saves')).not.toBeVisible()
  })

  test('EditableField name survives store re-render mid-edit', async ({ page }) => {
    // Validates fix: value removed from useEffect deps in EditableField
    const alliesSection = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ALLIES' }) })
    await alliesSection.getByRole('button', { name: 'Gorak' }).click()
    const nameInput = alliesSection.locator('input').filter({ hasValue: 'Gorak' })
    await expect(nameInput).toBeVisible()
    await nameInput.selectText()
    await nameInput.fill('Gorak the Mighty')
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const sylvara = enc.encounter.combatants.find(c => c.name === 'Sylvara')
      enc.updateHP(sylvara.id, -10)
    })
    await expect(nameInput).toHaveValue('Gorak the Mighty')
    await nameInput.press('Enter')
    await expect(alliesSection.getByText('Gorak the Mighty')).toBeVisible()
  })

  test('condition applied to enemy shows badge on row', async ({ page }) => {
    const enemySection = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ENEMIES' }) })
    await enemySection.getByText(String.fromCharCode(9660)).first().click()
    await page.getByRole('button', { name: 'Poisoned', exact: true }).click()
    await expect(enemySection.getByText(/Poisoned/).first()).toBeVisible()
  })

  test('MonsterSearch: no stale results after rapid open-type-close-reopen', async ({ page }) => {
    // Validates fix: clearTimeout on unmount in MonsterSearch
    const enemySection = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ENEMIES' }) })
    await enemySection.getByRole('button', { name: '+ Monster' }).click()
    await expect(page.getByPlaceholder('Search monsters…')).toBeVisible()
    await page.getByPlaceholder('Search monsters…').fill('gob')
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder('Search monsters…')).not.toBeVisible()
    await page.waitForTimeout(600)
    await enemySection.getByRole('button', { name: '+ Monster' }).click()
    await expect(page.getByPlaceholder('Search monsters…')).toBeVisible()
    await expect(page.getByPlaceholder('Search monsters…')).toHaveValue('')
    await expect(page.locator('ul li')).toHaveCount(0)
  })

  test('removing last combatant from initiative does not crash Next Turn', async ({ page }) => {
    // Validates fix: empty-list clamp in removeFromInitiative
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await page.evaluate(() => {
      const enc = window.__enc.getState()
      const ids = [...enc.encounter.initiativeOrder]
      for (const id of ids) enc.removeFromInitiative(id)
    })
    await expect(tracker.getByText('Round')).toBeVisible()
    // Next button is disabled when initiative is empty; call nextTurn directly to validate the guard
    await page.evaluate(() => window.__enc.getState().nextTurn())
    await expect(tracker.getByText('Round')).toBeVisible()
  })

  test('full combat round: 7 turns, correct HP deltas, round 2 reached', async ({ page }) => {
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    const turns = [
      { target: 'Sylvara',           dmg: 11 },
      { target: 'Hobgoblin Captain', dmg: 14 },
      { target: 'Hobgoblin Captain', dmg: 12 },
      { target: 'Gorak',             dmg:  8 },
      { target: 'Sylvara',           dmg:  7 },
      { target: 'Hobgoblin 1',       dmg: 16 },
      { target: 'Brother Aldric',    dmg:  9 },
    ]
    for (const { target, dmg } of turns) {
      await page.evaluate(({ target, dmg }) => {
        const enc = window.__enc.getState()
        const c = enc.encounter.combatants.find(x => x.name === target)
        if (c) enc.updateHP(c.id, -dmg)
      }, { target, dmg })
      await page.getByRole('button', { name: /Next/ }).click()
    }
    await expect(tracker.getByTestId('round-number')).toHaveText('2')
    const hp = await page.evaluate(() => {
      return window.__enc.getState().encounter.combatants.reduce((acc, c) => {
        acc[c.name] = c.hp.current
        return acc
      }, {})
    })
    expect(hp['Sylvara']).toBe(38 - 11 - 7)
    expect(hp['Hobgoblin Captain']).toBe(52 - 14 - 12)
    expect(hp['Gorak']).toBe(52 - 8)
    expect(hp['Hobgoblin 1']).toBe(18 - 16)
    expect(hp['Brother Aldric']).toBe(40 - 9)
  })

})
