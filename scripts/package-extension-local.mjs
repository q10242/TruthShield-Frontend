import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, 'public', 'extension')
const outputDir = resolve(root, 'dist', 'extension-local')
const webOrigin = process.env.TRUTHSHIELD_EXTENSION_WEB_ORIGIN || process.env.VITE_WEB_ORIGIN || 'http://127.0.0.1:15173'
const apiOrigin = process.env.TRUTHSHIELD_EXTENSION_API_ORIGIN || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:18080'

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })
cpSync(extensionDir, outputDir, { recursive: true })

function removeMetadataFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry)
    if (entry === '.DS_Store' || entry === '__MACOSX') {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    if (statSync(path).isDirectory()) {
      removeMetadataFiles(path)
    }
  }
}

function replaceInPackage(file, replacements) {
  const path = resolve(outputDir, file)
  let source = readFileSync(path, 'utf8')
  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to.replaceAll('\\', '\\\\').replaceAll("'", "\\'"))
  }
  writeFileSync(path, source)
}

removeMetadataFiles(outputDir)

const replacements = [
  ['https://truth-shield.otus.tw', webOrigin],
  ['https://truth-shield-api.otus.tw', apiOrigin],
  ['http://127.0.0.1:15173', webOrigin],
  ['http://127.0.0.1:18080', apiOrigin],
]

for (const file of ['content.js', 'background.js', 'options.js', 'popup.js', 'diagnostics.js']) {
  replaceInPackage(file, replacements)
}

console.log(outputDir)
console.log(`web origin: ${webOrigin}`)
console.log(`api origin: ${apiOrigin}`)
