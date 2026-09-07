import { expect, test } from '@playwright/test'

test('loads the real sky shell and essential controls', async ({ page }) => {
  await page.goto('/')

  const home = page.getByRole('link', { name: 'Spica home' })
  await expect(home).toBeVisible()
  await expect(home).toHaveAttribute('href', '/spica/')
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

  await page.getByRole('button', { name: 'Open observation journal' }).click()
  await expect(page.getByRole('button', { name: 'Add Jupiter' })).toBeVisible()
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
  await page.addInitScript(() => {
    const state = window as Window & { __spicaGeolocationOptions?: PositionOptions }
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback, _error?: PositionErrorCallback | null, options?: PositionOptions) {
          state.__spicaGeolocationOptions = options
          success({
            coords: {
              latitude: 35.681236,
              longitude: 139.767125,
              altitude: 41,
              accuracy: 12,
              altitudeAccuracy: 20,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          })
        },
        watchPosition: () => 0,
        clearWatch: () => undefined
      }
    })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })

  const viewportWidth = await page.evaluate(() => window.innerWidth)
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth)

  await page.getByRole('button', { name: 'Observer location: Greenwich, London' }).click()
  await expect(page.getByRole('heading', { name: 'Observer location' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use my current position' })).toBeVisible()
  await expect(page.getByLabel('Latitude')).toHaveValue('51.4769')
  await page.getByRole('button', { name: 'Use my current position' }).click()

  const currentLocation = page.getByRole('button', { name: 'Observer location: Current position' })
  await expect(currentLocation).toBeVisible()
  expect(await page.evaluate(() => (window as Window & { __spicaGeolocationOptions?: PositionOptions }).__spicaGeolocationOptions)).toMatchObject({
    enableHighAccuracy: true,
    timeout: 20_000,
    maximumAge: 0
  })

  await currentLocation.click()
  await expect(page.getByText('Last GPS fix: 35.6812°N, 139.7671°E, ±12 m')).toBeVisible()
  await expect(page.getByLabel('Latitude')).toHaveValue('35.681236')
  await expect(page.getByLabel('Longitude')).toHaveValue('139.767125')
})

test('mobile object details stay closed after selection polling', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile selection behavior is covered in the mobile project.')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })

  const search = page.getByRole('searchbox', { name: 'Find a sky object' })
  await search.fill('Jupiter')
  await page.getByRole('button', { name: /Jupiter Gas giant/ }).click()
  await expect(page.getByRole('heading', { name: 'Jupiter' })).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: 'Close object details' }).click()
  await expect(page.getByRole('heading', { name: 'Jupiter' })).not.toBeVisible()
  await page.waitForTimeout(2_500)
  await expect(page.getByRole('heading', { name: 'Jupiter' })).not.toBeVisible()
})

test('mobile compass requires calibration before device pointing', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Device orientation is covered in the mobile project.')
  await page.addInitScript(() => {
    class MockDeviceOrientationEvent extends Event {
      static requestPermission = async () => 'granted'
      alpha: number | null
      beta: number | null
      gamma: number | null
      absolute: boolean

      constructor(type: string, init: { alpha?: number; beta?: number; gamma?: number; absolute?: boolean } = {}) {
        super(type)
        this.alpha = init.alpha ?? null
        this.beta = init.beta ?? null
        this.gamma = init.gamma ?? null
        this.absolute = init.absolute ?? true
      }
    }
    Object.defineProperty(window, 'DeviceOrientationEvent', { configurable: true, value: MockDeviceOrientationEvent })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Point with your phone' })).toBeEnabled({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Point with your phone' }).click()
  await expect(page.getByRole('heading', { name: 'Point with your phone' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start device pointing' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Allow motion access' }).click()
  await expect(page.getByText('Waiting', { exact: true })).toBeVisible()

  await page.evaluate(() => {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 30, beta: 0, gamma: 0, absolute: true }))
  })
  await expect(page.getByText('330°')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Set north' })).toBeDisabled()

  await page.evaluate(async () => {
    for (const alpha of [0, 90, 180, 270, 45, 135, 225, 315, 60, 300]) {
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha, beta: 0, gamma: 0, absolute: true }))
      await new Promise((resolve) => window.setTimeout(resolve, 140))
    }
  })
  await expect(page.getByText(/Hold steady/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Set north' })).toBeDisabled()

  await page.waitForTimeout(2_100)
  await page.evaluate(async () => {
    const stableHeadings = [30, 29.5, 30.5, 30, 29, 31]
    for (let index = 0; index < 30; index += 1) {
      const alpha = stableHeadings[index % stableHeadings.length]
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha, beta: 0, gamma: 0, absolute: true }))
      await new Promise((resolve) => window.setTimeout(resolve, 70))
    }
  })
  await expect(page.getByText(/Stable ·/)).toBeVisible()
  await page.getByRole('button', { name: 'Set north' }).click()
  await expect(page.getByRole('heading', { name: 'Calibration ready' })).toBeVisible()
  await expect(page.locator('.bearing-readout strong')).toHaveText('0°')

  await page.getByRole('button', { name: 'Increase compass adjustment by 1 degree' }).click()
  await expect(page.getByText('+1°')).toBeVisible()
  await expect(page.locator('.bearing-readout strong')).toHaveText('1°')
  await page.getByRole('button', { name: 'Close compass panel' }).click()
  await page.getByRole('button', { name: 'Point with your phone' }).click()
  await expect(page.getByText('+1°')).toBeVisible()

  await page.getByRole('button', { name: 'Start device pointing' }).click()
  await expect(page.getByRole('heading', { name: 'Point with your phone' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Device pointing active' })).toHaveAttribute('aria-pressed', 'true')
  expect(Number(await page.evaluate(() => window.localStorage.getItem('spica-compass-offset')))).toBeCloseTo(30, 1)
  expect(await page.evaluate(() => window.localStorage.getItem('spica-compass-fine-offset'))).toBe('1')
})

test('mobile compass explains that LAN testing requires HTTPS', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Secure-context guidance is covered in the mobile project.')
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Point with your phone' })).toBeEnabled({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Point with your phone' }).click()
  await page.getByRole('button', { name: 'Allow motion access' }).click()
  await expect(page.getByText('Motion sensors require HTTPS. Open Spica through its secure published URL or an HTTPS development tunnel.')).toBeVisible()
})

test('mobile compass listens when the orientation constructor is hidden', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Constructor fallback is covered in the mobile project.')
  await page.addInitScript(() => {
    Object.defineProperty(window, 'DeviceOrientationEvent', { configurable: true, value: undefined })
    Object.defineProperty(window, 'DeviceMotionEvent', { configurable: true, value: undefined })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Point with your phone' })).toBeEnabled({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Point with your phone' }).click()
  await page.getByRole('button', { name: 'Allow motion access' }).click()
  await expect(page.getByText('Waiting', { exact: true })).toBeVisible()
  await page.evaluate(() => {
    const event = new Event('deviceorientationabsolute')
    Object.assign(event, { alpha: 15, beta: 0, gamma: 0, absolute: true })
    window.dispatchEvent(event)
  })
  await expect(page.locator('.bearing-readout strong')).toHaveText('345°')
})

test('mobile journal persists entries and validates backup restore', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Journal workflow is covered in the mobile project.')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Open observation journal' })).toBeVisible()
  await page.getByRole('button', { name: 'Open observation journal' }).click()

  await expect(page.getByRole('heading', { name: 'Observation journal' })).toBeVisible()
  await expect(page.getByText('Private by design. Every note stays in this browser.')).toBeVisible()
  const date = await page.getByLabel('Observing date').inputValue()
  await page.getByRole('button', { name: 'Mark this night observed' }).click()
  await page.getByPlaceholder('Add an object').fill('Mars')
  await page.getByRole('button', { name: 'Add sighting' }).click()
  await page.getByPlaceholder(/Cloud cover/).fill('Clear sky with light wind.')

  const savedEntry = await page.evaluate((dateKey) => {
    const journal = JSON.parse(window.localStorage.getItem('spica-observation-journal') ?? '{}')
    return journal.entries?.[dateKey]
  }, date)
  expect(savedEntry).toMatchObject({ checkedIn: true, notes: 'Clear sky with light wind.', sightings: ['Mars'] })

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  expect((await download).suggestedFilename()).toBe(`spica-journal-${date}.json`)

  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('input[type="file"]').setInputFiles({
    name: 'journal.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      entries: {
        [date]: {
          checkedIn: true,
          notes: 'Imported field notes.',
          sightings: ['Saturn'],
          updatedAt: new Date().toISOString()
        }
      }
    }))
  })
  await expect(page.getByText('Imported 1 journal entries')).toBeVisible()
  await expect(page.getByPlaceholder(/Cloud cover/)).toHaveValue('Imported field notes.')
  await expect(page.getByText('Saturn')).toBeVisible()

  await page.getByRole('button', { name: 'Close journal' }).click()
  await page.getByRole('button', { name: 'Open observation journal' }).click()
  await expect(page.getByPlaceholder(/Cloud cover/)).toHaveValue('Imported field notes.')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Observation journal' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Open observation journal' })).toBeFocused()
})
