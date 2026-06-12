import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, 'public', 'extension')
const outputDir = resolve(root, 'dist')
const packageDir = resolve(outputDir, 'safari-extension-source')
const manifest = JSON.parse(readFileSync(resolve(extensionDir, 'manifest.json'), 'utf8'))
const version = manifest.version
const outputFile = resolve(outputDir, `truthshield-safari-extension-source-v${version}.zip`)
const outputLatestFile = resolve(outputDir, 'truthshield-safari-extension-source.zip')
const publicOutputFile = resolve(root, 'public', 'truthshield-safari-extension-source.zip')
const publicVersionedOutputFile = resolve(root, 'public', `truthshield-safari-extension-source-v${version}.zip`)
const webOrigin = process.env.TRUTHSHIELD_EXTENSION_WEB_ORIGIN || process.env.VITE_WEB_ORIGIN || ''
const apiOrigin = process.env.TRUTHSHIELD_EXTENSION_API_ORIGIN || process.env.VITE_API_BASE_URL || ''

mkdirSync(outputDir, { recursive: true })
rmSync(packageDir, { recursive: true, force: true })
rmSync(outputFile, { force: true })
rmSync(outputLatestFile, { force: true })
rmSync(publicOutputFile, { force: true })
rmSync(publicVersionedOutputFile, { force: true })

for (const dir of [outputDir, resolve(root, 'public')]) {
  for (const entry of readdirSync(dir)) {
    if (/^truthshield-safari-extension-source-v.+\.zip$/.test(entry)) {
      rmSync(resolve(dir, entry), { force: true })
    }
  }
}

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

const check = spawnSync('node', ['scripts/check-extension-release.mjs', 'dist/safari-extension-source'], {
  cwd: root,
  stdio: 'inherit',
})

if (check.status !== 0) {
  throw new Error('Safari source extension release check failed.')
}

const result = spawnSync('zip', ['-r', outputFile, '.'], {
  cwd: packageDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  throw new Error('zip command failed; install zip or package dist/safari-extension-source manually.')
}

cpSync(outputFile, outputLatestFile)
cpSync(outputFile, publicOutputFile)
cpSync(outputFile, publicVersionedOutputFile)
console.log(packageDir)
console.log(outputFile)
console.log(outputLatestFile)
console.log(publicOutputFile)
console.log(publicVersionedOutputFile)
