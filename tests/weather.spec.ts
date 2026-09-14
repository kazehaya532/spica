import { expect, test } from '@playwright/test'
import { lightMapFixture } from '../src/test/lightmapFixture'
import { weatherFixture } from '../src/test/weatherFixture'

test.use({ timezoneId: 'UTC' })

test('tonight action explains whether the selected sky time changes', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Night-sky feedback is covered once on desktop.')
  await page.goto('/')
  const tonight = page.getByRole('button', { name: 'Return to the current sky' })
  await expect(tonight).toBeEnabled({ timeout: 30_000 })
  await tonight.click()
  await expect(page.getByText(/Returned to the current sky/)).toBeVisible()

  const skyTime = page.getByLabel('Sky date and time')
  await skyTime.fill('2026-09-11T12:00')
  await page.getByRole('button', { name: 'Show tonight’s sky' }).click()
  await expect(page.getByText(/Jumped to .*start of astronomical darkness/)).toBeVisible()
  await expect(skyTime).not.toHaveValue('2026-09-11T12:00')

  await page.getByRole('button', { name: 'Return to the current sky' }).click()
  await skyTime.fill('2026-09-11T22:00')
  await page.getByRole('button', { name: 'Show tonight’s sky' }).click()
  await expect(page.getByText(/already astronomical night at Greenwich, London/)).toBeVisible()
  await expect(skyTime).toHaveValue('2026-09-11T22:00')
})

test('night forecast is opt-in, location-correct and retained across panel closes', async ({ page }, testInfo) => {
  const requests: URL[] = []
  let lightMapRequests = 0
  let fail = false
  await page.route('**/lightmap/spica-lightmap.bin', async (route) => {
    lightMapRequests += 1
    await route.fulfill({ contentType: 'application/octet-stream', body: Buffer.from(lightMapFixture()) })
  })
  await page.route('https://api.open-meteo.com/v1/forecast?*', async (route) => {
    requests.push(new URL(route.request().url()))
    if (fail) await route.fulfill({ status: 503, body: 'Unavailable' })
    else await route.fulfill({ json: weatherFixture() })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Pause time' })).toBeEnabled({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Pause time' }).click()
  await page.getByLabel('Sky date and time').fill('2026-09-11T20:00')
  await page.getByRole('button', { name: 'Open observing conditions' }).click()
  await expect(page.getByText('Bortle 1')).toBeVisible()
  await expect(page.getByText(/illuminated at the selected sky time/)).toBeVisible()
  await expect(page.locator('.moon-data').getByText(/Above|Below/)).toBeVisible()
  expect(lightMapRequests).toBe(1)
  expect(requests).toHaveLength(0)
  await page.getByRole('button', { name: 'Check night forecast' }).click()
  await expect(page.getByText('Good window', { exact: true })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0].searchParams.get('latitude')).toBe('51.4769')
  expect(requests[0].searchParams.get('longitude')).toBe('0')
  expect(requests[0].searchParams.get('timeformat')).toBe('unixtime')
  await expect(page.getByRole('cell', { name: 'NE 9 km/h', exact: true }).first()).toBeVisible()
  await expect(page.getByText('20:00–22:00', { exact: true })).toBeVisible()
  const panel = page.getByRole('complementary', { name: 'Observing conditions' })
  expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  const bounds = await panel.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: testInfo.outputPath('weather.png') })

  await page.getByRole('button', { name: 'Close observing conditions' }).click()
  await page.getByRole('button', { name: 'Open observing conditions' }).click()
  await expect(page.getByText('Good window', { exact: true })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(lightMapRequests).toBe(1)
  fail = true
  await page.getByRole('button', { name: 'Refresh forecast' }).click()
  await expect(page.getByText(/Could not load the forecast/)).toBeVisible()
  await page.getByRole('button', { name: 'Close observing conditions' }).click()
  await page.getByLabel('Sky date and time').fill('2030-01-01T20:00')
  await page.getByRole('button', { name: 'Open observing conditions' }).click()
  await expect(page.getByText(/No complete sunset-to-sunrise/)).toBeVisible()
  expect(requests).toHaveLength(2)

  await page.getByRole('button', { name: 'Change location' }).click()
  await expect(page.getByRole('complementary', { name: 'Observer location' })).toBeFocused()
  await page.getByLabel('Latitude', { exact: true }).fill('-6.2')
  await page.getByLabel('Longitude', { exact: true }).fill('106.8')
  await page.getByLabel('Place name').fill('Jakarta')
  await page.getByRole('button', { name: 'Set observer location' }).click()
  await page.getByRole('button', { name: 'Open observing conditions' }).click()
  await expect(page.getByRole('complementary', { name: 'Observing conditions' }).getByText('Jakarta', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check night forecast' })).toBeVisible()
  await expect(page.getByText(/No complete sunset-to-sunrise/)).not.toBeVisible()
  expect(requests).toHaveLength(2)
  expect(lightMapRequests).toBe(1)
  fail = false
  await page.getByRole('button', { name: 'Check night forecast' }).click()
  await expect.poll(() => requests.length).toBe(3)
  expect(requests[2].searchParams.get('latitude')).toBe('-6.2')
  expect(requests[2].searchParams.get('longitude')).toBe('106.8')
})
