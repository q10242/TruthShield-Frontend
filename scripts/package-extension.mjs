import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, 'public', 'extension')
const outputDir = resolve(root, 'dist')
const outputFile = resolve(outputDir, 'truthshield-extension.zip')
const publicOutputFile = resolve(root, 'public', 'truthshield-extension.zip')

mkdirSync(outputDir, { recursive: true })
rmSync(outputFile, { force: true })
rmSync(publicOutputFile, { force: true })

const result = spawnSync('zip', ['-r', outputFile, '.'], {
  cwd: extensionDir,
  stdio: 'inherit',
})

if (result.status !== 0) {
  throw new Error('zip command failed; install zip or package public/extension manually.')
}

copyFileSync(outputFile, publicOutputFile)
console.log(outputFile)
console.log(publicOutputFile)
