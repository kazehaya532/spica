import { expect, test } from '@playwright/test'

test('loads the real sky shell and essential controls', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Spica home' })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Find a sky object' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })
  await expect(page.locator('canvas[aria-label^="Interactive night sky"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hide Constellations' })).toBeEnabled()
})

test('search centers a built-in planet', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })

  const search = page.getByRole('searchbox', { name: 'Find a sky object' })
  await search.fill('Jupiter')
  await page.getByRole('button', { name: /Jupiter Gas giant/ }).click()

  await expect(page.getByRole('heading', { name: 'Jupiter' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/horizon|Calculating/)).toBeVisible()
})

test('night sky activates the Milky Way and deep-sky layers independently of red light', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Engine behavior is covered once on desktop.')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Return to the current sky' })).toBeEnabled({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Hide Deep sky' }).click()
  await page.getByRole('button', { name: 'Hide Milky Way' }).click()
  await page.getByRole('button', { name: 'Return to the current sky' }).click()
  await page.getByRole('button', { name: 'Show tonight’s sky' }).click()

  await expect(page.getByRole('button', { name: 'Hide Deep sky' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Hide Milky Way' })).toHaveAttribute('aria-pressed', 'true')

  const redLight = page.getByRole('button', { name: 'Toggle red-light mode' })
  await expect(redLight).toHaveAttribute('aria-pressed', 'false')
  await redLight.click()
  await expect(page.locator('.red-light-overlay')).toHaveCSS('visibility', 'visible')
})

test('offline catalog resolves named stars and a deep-sky object after loading', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Catalog loading is covered once on desktop.')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })

  const search = page.getByRole('searchbox', { name: 'Find a sky object' })
  for (const [query, result] of [
    ['Bettelguese', 'Betelgeuse'],
    ['Spica', 'Spica'],
    ['Orion Nebula', 'Orion Nebula']
  ]) {
    await search.fill(query)
    await page.getByRole('button', { name: new RegExp(result) }).click()
    await expect(page.getByRole('heading', { name: result })).toBeVisible({ timeout: 15_000 })
  }
})

test('mobile controls fit the viewport and location remains manual-first', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile layout is covered in the mobile project.')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })

  const viewportWidth = await page.evaluate(() => window.innerWidth)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth)

  await page.getByRole('button', { name: 'Observer location: Greenwich, London' }).click()
  await expect(page.getByRole('heading', { name: 'Observer location' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use my current position' })).toBeVisible()
  await expect(page.getByLabel('Latitude')).toHaveValue('51.4769')
})
