import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, 'public', 'extension')
const outputDir = resolve(root, 'dist')
const packageDir = resolve(outputDir, 'safari-extension-package')
const safariProjectRoot = resolve(outputDir, 'safari')
const appName = process.env.TRUTHSHIELD_SAFARI_APP_NAME || 'TruthShield Safari'
const bundleIdentifier = process.env.TRUTHSHIELD_SAFARI_BUNDLE_ID || 'tw.otus.truthshield.safari'
const webOrigin = process.env.TRUTHSHIELD_EXTENSION_WEB_ORIGIN || process.env.VITE_WEB_ORIGIN || ''
const apiOrigin = process.env.TRUTHSHIELD_EXTENSION_API_ORIGIN || process.env.VITE_API_BASE_URL || ''

mkdirSync(outputDir, { recursive: true })
rmSync(packageDir, { recursive: true, force: true })
rmSync(safariProjectRoot, { recursive: true, force: true })

cpSync(extensionDir, packageDir, { recursive: true })

function removeMetadataFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry)
    if (entry === '.DS_Store' || entry === '__MACOSX') {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    if (statSync(path).isDirectory()) removeMetadataFiles(path)
  }
}

function replaceInPackage(file, replacements) {
  const path = resolve(packageDir, file)
  let source = readFileSync(path, 'utf8')
  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to.replaceAll('\\', '\\\\').replaceAll("'", "\\'"))
  }
  writeFileSync(path, source)
}

removeMetadataFiles(packageDir)

if (webOrigin || apiOrigin) {
  const replacements = [
    ['https://truth-shield.otus.tw', webOrigin],
    ['https://truth-shield-api.otus.tw', apiOrigin],
    ['http://127.0.0.1:15173', webOrigin],
    ['http://127.0.0.1:18080', apiOrigin],
  ].filter(([, value]) => value)

  for (const file of ['content.js', 'background.js', 'options.js', 'popup.js', 'diagnostics.js']) {
    replaceInPackage(file, replacements)
  }
}

replaceInPackage('content.js', [
  ["  '127.0.0.1',\n  'localhost',\n", ''],
])

const check = spawnSync('node', ['scripts/check-extension-release.mjs', 'dist/safari-extension-package'], {
  cwd: root,
  stdio: 'inherit',
})

if (check.status !== 0) {
  throw new Error('Safari extension release check failed.')
}

const result = spawnSync('xcrun', [
  'safari-web-extension-converter',
  packageDir,
  '--project-location',
  safariProjectRoot,
  '--app-name',
  appName,
  '--bundle-identifier',
  bundleIdentifier,
  '--swift',
  '--copy-resources',
  '--no-open',
  '--no-prompt',
  '--force',
], {
  cwd: root,
  stdio: 'inherit',
})

if (result.status !== 0) {
  throw new Error('Safari Web Extension packaging failed. Install/update Xcode and try again.')
}

console.log(resolve(safariProjectRoot, appName, `${appName}.xcodeproj`))
