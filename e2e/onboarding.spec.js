import { test, expect } from '@playwright/test'

// Fresh slate for every test: clear all browser storage and reload.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

const enterApp = async (page) => {
  await page.getByRole('button', { name: /Roll for Initiative/i }).click()
}

test.describe('Onboarding — first-time user', () => {
  test('auto-starts the welcome modal after Roll for Initiative', async ({ page }) => {
    await enterApp(page)
    await expect(page.getByText('Welcome to Battle Tracker')).toBeVisible()
    await expect(page.getByText('Step 1 of 6')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start tour' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible()
  })

  test('full happy-path: walks all 6 steps and keeps demo', async ({ page }) => {
    await enterApp(page)

    // Step 1: welcome → Start tour seeds the demo encounter
    await page.getByRole('button', { name: 'Start tour' }).click()

    // Demo modules should now be on the canvas
    await expect(page.locator('[data-onboarding="module-InitiativeTracker"]')).toBeVisible()
    await expect(page.locator('[data-onboarding="module-CombatantTable-ally"]')).toBeVisible()
    await expect(page.locator('[data-onboarding="module-CombatantTable-enemy"]')).toBeVisible()
    await expect(page.locator('[data-onboarding="module-PartyManager"]')).toBeVisible()

    // Demo combatants are in the store (verified via the encounter persist key)
    const partyNames = await page.evaluate(() => {
      const raw = localStorage.getItem('dnd-tracker-encounter')
      const combatants = raw ? JSON.parse(raw).state?.encounter?.combatants ?? [] : []
      return combatants.map(c => c.name)
    })
    expect(partyNames).toContain('Aria the Bold')
    expect(partyNames).toContain('Goblin Boss')

    // Step through spotlights 2 → 5
    await expect(page.getByText('Step 2 of 6')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText('Step 3 of 6')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText('Step 4 of 6')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText('Step 5 of 6')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    // Step 6: closing modal — keep the demo
    await expect(page.getByText("You're set")).toBeVisible()
    await expect(page.getByText('Step 6 of 6')).toBeVisible()
    await page.getByRole('button', { name: 'Keep demo' }).click()

    // Tour gone, demo modules still around
    await expect(page.getByText("You're set")).not.toBeVisible()
    await expect(page.locator('[data-onboarding="module-InitiativeTracker"]')).toBeVisible()
  })

  test('skip from welcome → no demo seeded, flag set', async ({ page }) => {
    await enterApp(page)
    await page.getByRole('button', { name: 'Skip' }).click()

    // No demo modules
    await expect(page.locator('[data-onboarding="module-InitiativeTracker"]')).not.toBeVisible()
    const combatantCount = await page.evaluate(() => {
      const raw = localStorage.getItem('dnd-tracker-encounter')
      return raw ? (JSON.parse(raw).state?.encounter?.combatants ?? []).length : 0
    })
    expect(combatantCount).toBe(0)

    // hasOnboarded flag should be persisted
    const flag = await page.evaluate(() => {
      const raw = localStorage.getItem('dnd-tracker-ui')
      return raw ? JSON.parse(raw).state?.hasOnboarded : null
    })
    expect(flag).toBe(true)
  })

  test('clear demo on finish removes seeded modules and combatants', async ({ page }) => {
    await enterApp(page)
    await page.getByRole('button', { name: 'Start tour' }).click()

    // Fast-forward through spotlights
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next', exact: true }).click()
    }

    await page.getByRole('button', { name: 'Clear demo' }).click()

    await expect(page.locator('[data-onboarding="module-InitiativeTracker"]')).not.toBeVisible()
    const remaining = await page.evaluate(() => {
      const raw = localStorage.getItem('dnd-tracker-encounter')
      const combatants = raw ? JSON.parse(raw).state?.encounter?.combatants ?? [] : []
      return combatants.filter(c => c._source === 'demo').length
    })
    expect(remaining).toBe(0)
  })

  test('does not auto-start onboarding for returning users', async ({ page }) => {
    // Complete the tour first
    await enterApp(page)
    await page.getByRole('button', { name: 'Skip' }).click()

    // Reset hasEntered (uiStore does not persist it) and reload
    await page.reload()

    // LandingPage again, click Roll for Initiative — no welcome modal this time
    await page.getByRole('button', { name: /Roll for Initiative/i }).click()
    await expect(page.getByText('Welcome to Battle Tracker')).not.toBeVisible()
  })

  test('Help button in TopBar replays the tour', async ({ page }) => {
    // Skip the first-run tour to mark hasOnboarded=true
    await enterApp(page)
    await page.getByRole('button', { name: 'Skip' }).click()

    // Click the help/? button in the TopBar
    await page.getByRole('button', { name: 'Replay tutorial' }).click()
    await expect(page.getByText('Welcome to Battle Tracker')).toBeVisible()
  })
})
