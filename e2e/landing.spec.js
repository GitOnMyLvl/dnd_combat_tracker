import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('landing page explains the app and is in the static HTML', async ({ page, request }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('initiative')
  const html = await (await request.get('/')).text()
  expect(html).toContain('<meta name="description"')
})

test('Start tracking opens the standard layout with a quick guide', async ({ page }) => {
  await page.getByRole('button', { name: 'Start tracking' }).first().click()
  await expect(page.locator('.drag-handle', { hasText: 'INITIATIVE' })).toBeVisible()
  await expect(page.locator('.drag-handle', { hasText: 'ENEMIES' })).toBeVisible()
  await expect(page.locator('.drag-handle', { hasText: 'ALLIES' })).toBeVisible()
  await expect(page.getByRole('note')).toContainText('Sort')

  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(page.getByRole('note')).toHaveCount(0)

  // Returning visitors skip the landing page
  await page.reload()
  await expect(page.locator('.drag-handle', { hasText: 'INITIATIVE' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start tracking' })).toHaveCount(0)
})

test('demo fight is ready to run', async ({ page }) => {
  await page.getByRole('button', { name: 'Try a demo fight' }).click()
  const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
  await expect(tracker.getByText('Goblin Boss')).toBeVisible()
  await tracker.getByRole('button', { name: /Next/ }).click()
  await expect(tracker.getByTestId('round-number')).toHaveText('1')
})

test('a monster added in the enemy table shows up in initiative', async ({ page }) => {
  await page.getByRole('button', { name: 'Start tracking' }).first().click()
  const enemies = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'ENEMIES' }) })
  await enemies.getByRole('button', { name: '+ Add' }).click()
  await page.getByPlaceholder('Name').fill('Owlbear')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  const tracker = page.locator('.card', { has: page.locator('.drag-handle', { hasText: 'INITIATIVE' }) })
  await expect(tracker.getByText('Owlbear')).toBeVisible()
})

test('mobile: secondary actions live in the menu, no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Start tracking' }).first().click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.getByRole('button', { name: /Encounters/ })).toBeVisible()
})
