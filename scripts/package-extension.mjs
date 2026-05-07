import { cpSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, 'public', 'extension')
const outputDir = resolve(root, 'dist')
const packageDir = resolve(outputDir, 'extension-package')
const outputFile = resolve(outputDir, 'truthshield-extension.zip')
const publicOutputFile = resolve(root, 'public', 'truthshield-extension.zip')
const webOrigin = process.env.TRUTHSHIELD_EXTENSION_WEB_ORIGIN || process.env.VITE_WEB_ORIGIN || ''
const apiOrigin = process.env.TRUTHSHIELD_EXTENSION_API_ORIGIN || process.env.VITE_API_BASE_URL || ''

mkdirSync(outputDir, { recursive: true })
rmSync(packageDir, { recursive: true, force: true })
rmSync(outputFile, { force: true })
rmSync(publicOutputFile, { force: true })
cpSync(extensionDir, packageDir, { recursive: true })

if (webOrigin || apiOrigin) {
  const replacements = [
    ['http://127.0.0.1:15173', webOrigin],
    ['http://127.0.0.1:18080', apiOrigin],
  ].filter(([, value]) => value)

  for (const file of ['content.js', 'background.js', 'options.js', 'popup.js', 'diagnostics.js']) {
    const path = resolve(packageDir, file)
    let source = readFileSync(path, 'utf8')
    for (const [from, to] of replacements) {
      source = source.replaceAll(from, to.replaceAll('\\', '\\\\').replaceAll("'", "\\'"))
    }
    writeFileSync(path, source)
  }
}

const result = spawnSync('zip', ['-r', outputFile, '.'], {
  cwd: packageDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  throw new Error('zip command failed; install zip or package public/extension manually.')
}

copyFileSync(outputFile, publicOutputFile)
console.log(outputFile)
console.log(publicOutputFile)
