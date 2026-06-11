import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, 'public', 'extension')
const outputDir = resolve(root, 'dist')
const packageDir = resolve(outputDir, 'firefox-extension-package')
const manifestPath = resolve(extensionDir, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const version = manifest.version
const outputFile = resolve(outputDir, `truthshield-firefox-extension-v${version}.zip`)
const outputLatestFile = resolve(outputDir, 'truthshield-firefox-extension.zip')
const webOrigin = process.env.TRUTHSHIELD_EXTENSION_WEB_ORIGIN || process.env.VITE_WEB_ORIGIN || ''
const apiOrigin = process.env.TRUTHSHIELD_EXTENSION_API_ORIGIN || process.env.VITE_API_BASE_URL || ''

mkdirSync(outputDir, { recursive: true })
rmSync(packageDir, { recursive: true, force: true })
rmSync(outputFile, { force: true })
rmSync(outputLatestFile, { force: true })

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

const firefoxManifestPath = resolve(packageDir, 'manifest.json')
const firefoxManifest = JSON.parse(readFileSync(firefoxManifestPath, 'utf8'))
firefoxManifest.background = {
  scripts: ['background.js'],
}
firefoxManifest.browser_specific_settings = {
  gecko: {
    id: 'truthshield@otus.tw',
    data_collection_permissions: {
      required: ['websiteActivity', 'websiteContent'],
    },
    strict_min_version: '142.0',
  },
}
writeFileSync(firefoxManifestPath, `${JSON.stringify(firefoxManifest, null, 2)}\n`)

const check = spawnSync('node', ['scripts/check-extension-release.mjs', 'dist/firefox-extension-package'], {
  cwd: root,
  stdio: 'inherit',
})

if (check.status !== 0) {
  throw new Error('Firefox extension release check failed.')
}

const result = spawnSync('zip', ['-r', outputFile, '.'], {
  cwd: packageDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  throw new Error('zip command failed; install zip or package dist/firefox-extension-package manually.')
}

cpSync(outputFile, outputLatestFile)
console.log(packageDir)
console.log(outputFile)
console.log(outputLatestFile)
