// Regenerates public/preview.webp (landing page) and public/og-image.png
// (social previews) from the running app with the demo encounter.
// Usage: npm run build && npx vite preview --port 4173 & node scripts/capture-previews.mjs
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const BASE = process.argv[2] ?? 'http://localhost:4173/'

async function capture(browser, { width, height }) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(BASE)
  await page.getByRole('button', { name: 'Try a demo fight' }).first().click()
  await page.getByRole('button', { name: 'Got it' }).click()
  await page.getByRole('button', { name: /Next/ }).click()
  await page.waitForTimeout(400)
  const png = await page.screenshot()
  await page.close()
  return png
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
try {
  const preview = await capture(browser, { width: 1600, height: 1000 })
  await sharp(preview).webp({ quality: 80 }).toFile('public/preview.webp')
  const og = await capture(browser, { width: 1200, height: 630 })
  await sharp(og).png({ compressionLevel: 9, palette: true }).toFile('public/og-image.png')
} finally {
  await browser.close()
}
