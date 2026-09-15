// Renders the transparent favicon SVG to a 32px transparent PNG using the
// bundled Playwright browser, then verifies the alpha channel for real.
// Run once after changing public/icons/spica-favicon.svg:
//   node scripts/make-favicon-png.mjs
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = resolve(root, 'public/icons/spica-favicon.svg')
const outPath = resolve(root, 'public/icons/spica-favicon-32.png')
const svg = readFileSync(svgPath, 'utf-8')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(`<!doctype html><body style="margin:0">${svg}</body>`)
const svgEl = page.locator('svg')
await svgEl.evaluate((el) => {
  el.setAttribute('width', '32')
  el.setAttribute('height', '32')
})
await svgEl.screenshot({ path: outPath, omitBackground: true })

// Verify: truecolor-with-alpha color type and a fully transparent corner.
const png = readFileSync(outPath)
const colorType = png[25]
const base64 = png.toString('base64')
const cornerAlpha = await page.evaluate(async (data) => {
  const img = new Image()
  img.src = `data:image/png;base64,${data}`
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, 1, 1).data[3]
}, base64)
await browser.close()

if (colorType !== 6) throw new Error(`Expected RGBA PNG (color type 6), got ${colorType}`)
if (cornerAlpha !== 0) throw new Error(`Expected transparent corner pixel, alpha=${cornerAlpha}`)
console.log(`spica-favicon-32.png written: ${png.length} bytes, RGBA, corner alpha ${cornerAlpha} (transparent)`)
