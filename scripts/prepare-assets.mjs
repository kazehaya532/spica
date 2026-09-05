import { cpSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const engine = resolve(root, 'vendor/stellarium-web-engine')
const skydata = resolve(engine, 'apps/test-skydata')
const publicDir = resolve(root, 'public')

for (const generated of ['engine', 'skydata', 'fonts']) {
  rmSync(resolve(publicDir, generated), { recursive: true, force: true })
}

mkdirSync(resolve(publicDir, 'engine'), { recursive: true })
mkdirSync(resolve(publicDir, 'fonts'), { recursive: true })

for (const artifact of ['stellarium-web-engine.js', 'stellarium-web-engine.wasm']) {
  copyFileSync(resolve(engine, 'build', artifact), resolve(publicDir, 'engine', artifact))
}

for (const dataSet of [
  'stars',
  'dso',
  'landscapes/guereins',
  'surveys/milkyway',
  'surveys/sso/moon',
  'surveys/sso/sun'
]) {
  cpSync(resolve(skydata, dataSet), resolve(publicDir, 'skydata', dataSet), { recursive: true })
}

const cultureTarget = resolve(publicDir, 'skydata/skycultures/western')
mkdirSync(cultureTarget, { recursive: true })
copyFileSync(resolve(skydata, 'skycultures/western/index.json'), resolve(cultureTarget, 'index.json'))

for (const font of ['Roboto-Regular.ttf', 'Roboto-Bold.ttf']) {
  copyFileSync(
    resolve(engine, 'apps/simple-html/static/fonts', font),
    resolve(publicDir, 'fonts', font)
  )
}

console.log('Prepared Stellarium engine and essential sky data.')
