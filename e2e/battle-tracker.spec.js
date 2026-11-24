import { test, expect } from '@playwright/test'

// Clear localStorage before each test for a clean slate
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Start from an empty canvas, past the landing page and first-run guide
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('dnd-tracker-ui', JSON.stringify({ state: { hasEntered: true, showGuide: false }, version: 0 }))
  })
  await page.reload()
})

test.describe('Empty Canvas', () => {
  test('shows empty state message', async ({ page }) => {
    await expect(page.getByText('Canvas is empty')).toBeVisible()
    await expect(page.getByText('Ready your party')).toBeVisible()
  })
})

test.describe('Module Picker', () => {
  test('opens module picker and adds Initiative Tracker', async ({ page }) => {
    await page.getByTitle('Add module').click()
    await expect(page.getByText('Add Module', { exact: true })).toBeVisible()

    // Click the Initiative Tracker option
    await page.getByRole('button', { name: /Initiative Tracker/ }).click()

    // Module should appear on canvas
    await expect(page.locator('.drag-handle', { hasText: 'INITIATIVE' })).toBeVisible()
  })

  test('opens module picker via top bar button', async ({ page }) => {
    await page.getByRole('button', { name: 'Module', exact: true }).click()
    await expect(page.getByText('Add Module', { exact: true })).toBeVisible()
  })

  test('adds Enemies Table and Allies Table', async ({ page }) => {
    // Add enemies
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Enemies Table/ }).click()
    await expect(page.locator('.drag-handle', { hasText: 'ENEMIES' })).toBeVisible()

    // Add allies
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Allies Table/ }).click()
    await expect(page.locator('.drag-handle', { hasText: 'ALLIES' })).toBeVisible()
  })
})

test.describe('Adding Combatants', () => {
  test('adds an enemy manually', async ({ page }) => {
    // Add enemies table
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Enemies Table/ }).click()

    // Click + Add
    await page.getByRole('button', { name: '+ Add' }).click()

    // Fill the form
    await page.getByPlaceholder('Name').fill('Goblin')
    // Click the Add button inside the modal
    await page.locator('.card button', { hasText: 'Add' }).last().click()

    // Goblin should appear in the table
    await expect(page.getByText('Goblin')).toBeVisible()
    await expect(page.getByText('1 combatant')).toBeVisible()
  })

  test('adds an ally manually', async ({ page }) => {
    // Add allies table
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Allies Table/ }).click()

    // Click + Add
    await page.getByRole('button', { name: '+ Add' }).click()

    // Fill the form
    await page.getByPlaceholder('Name').fill('Aragorn')
    await page.locator('.card button', { hasText: 'Add' }).last().click()

    // Should appear
    await expect(page.getByText('Aragorn')).toBeVisible()
  })
})

test.describe('Initiative Tracking', () => {
  test('add combatants, sort initiative, advance turns', async ({ page }) => {
    // Add Initiative Tracker
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Initiative Tracker/ }).click()

    // Add Enemies Table
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Enemies Table/ }).click()

    // Add enemy: Goblin
    const enemySection = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ENEMIES' }) })
    await enemySection.getByRole('button', { name: '+ Add' }).click()
    await page.getByPlaceholder('Name').fill('Goblin')
    await page.locator('.card button', { hasText: 'Add' }).last().click()

    // Wait for modal to close
    await expect(page.getByPlaceholder('Name')).not.toBeVisible()

    // Add Allies Table
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Allies Table/ }).click()

    // Add ally: Fighter
    const allySection = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ALLIES' }) })
    await allySection.getByRole('button', { name: '+ Add' }).click()
    await page.getByPlaceholder('Name').fill('Fighter')
    await page.locator('.card button', { hasText: 'Add' }).last().click()

    // Wait for modal to close
    await expect(page.getByPlaceholder('Name')).not.toBeVisible()

    // Both joined the initiative order automatically; sort and advance
    const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
    await expect(tracker.getByText('Goblin')).toBeVisible()
    await expect(tracker.getByText('Fighter')).toBeVisible()
    await tracker.getByRole('button', { name: 'Sort', exact: true }).click()
    await expect(tracker.getByTestId('round-number')).toHaveText('1')
    await tracker.getByRole('button', { name: /Next/ }).click()
    await tracker.getByRole('button', { name: /Next/ }).click()
    await expect(tracker.getByTestId('round-number')).toHaveText('2')
  })
})

test.describe('Dice Roller', () => {
  test('rolls dice and shows result in history', async ({ page }) => {
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Dice Roller/ }).click()

    await page.getByRole('button', { name: 'Roll 1d20' }).click()

    const dice = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'DICE' }) })
    await expect(dice.getByText('d20', { exact: true }).last()).toBeVisible()
  })

  test('rolls a pocket of mixed dice', async ({ page }) => {
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Dice Roller/ }).click()

    await page.getByRole('button', { name: 'Increase d6 count' }).click()
    await page.getByRole('button', { name: 'Increase d6 count' }).click()
    await page.getByRole('button', { name: 'Increase d8 count' }).click()
    await page.getByRole('button', { name: 'Roll dice (3)' }).click()

    const dice = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'DICE' }) })
    await expect(dice.getByText('2d6 + 1d8').first()).toBeVisible()
  })

  test('rolls with advantage', async ({ page }) => {
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Dice Roller/ }).click()

    await page.getByRole('button', { name: 'Advantage', exact: true }).click()
    await page.getByRole('button', { name: 'Roll 1d20' }).click()

    const dice = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'DICE' }) })
    await expect(dice.getByText('d20 · ADV').first()).toBeVisible()
  })
})

test.describe('Encounter Management', () => {
  test('renames encounter', async ({ page }) => {
    // Click the encounter name button in the top bar
    await page.getByTitle('Click to rename').click()
    const nameInput = page.locator('input:focus')
    await nameInput.clear()
    await nameInput.fill('Dragon Fight')
    await nameInput.press('Enter')

    // Should display new name
    await expect(page.getByTitle('Click to rename')).toHaveText('Dragon Fight')
  })

  test('saves and loads encounter', async ({ page }) => {
    // Rename first
    await page.getByTitle('Click to rename').click()
    const nameInput = page.locator('input:focus')
    await nameInput.clear()
    await nameInput.fill('Saved Battle')
    await nameInput.press('Enter')

    // Save it to the list from the Encounters menu
    await page.getByRole('button', { name: /Encounters/ }).click()
    await expect(page.getByText('Saved Encounters', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Save "Saved Battle" to list' }).click()
    // The dropdown shows the encounter name — verify by checking the dropdown list
    const dropdown = page.locator('.card', { hasText: 'Saved Encounters' })
    await expect(dropdown.getByText('Saved Battle')).toBeVisible()
  })
})

test.describe('Theme', () => {
  test('toggles between dark and light theme', async ({ page }) => {
    await expect(page.locator('html')).not.toHaveClass(/light/)

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveClass(/light/)

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).not.toHaveClass(/light/)
  })
})

test.describe('Conditions', () => {
  test('applies condition via expanded combatant row', async ({ page }) => {
    // Add Enemies table
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /Enemies Table/ }).click()

    // Add an enemy
    const enemySection = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ENEMIES' }) })
    await enemySection.getByRole('button', { name: '+ Add' }).click()
    await page.getByPlaceholder('Name').fill('Orc')
    await page.locator('.card button', { hasText: 'Add' }).last().click()

    // Wait for modal to close
    await expect(page.getByPlaceholder('Name')).not.toBeVisible()

    // Click the expand arrow (▼) to expand the combatant row
    // (The name area has stopPropagation, so we click the arrow instead)
    await enemySection.getByText('▼').click()

    // The expanded row shows condition toggle buttons
    await enemySection.getByRole('button', { name: 'Blinded', exact: true }).click()

    // The condition badge should appear on the combatant summary
    await expect(enemySection.getByText(/Blinded/).first()).toBeVisible()
  })
})

test.describe('Notes Pad', () => {
  test('types and auto-saves notes', async ({ page }) => {
    await page.getByTitle('Add module').click()
    await page.getByRole('button', { name: /^Notes Free/ }).click()

    const textarea = page.getByPlaceholder('DM notes, monster descriptions, reminders…')
    await textarea.fill('The dragon is hiding in the cave')

    // Should show "Saved" after auto-save
    const notesPanel = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'NOTES' }) })
    await expect(notesPanel.getByText('Saved')).toBeVisible({ timeout: 5000 })
  })
})
