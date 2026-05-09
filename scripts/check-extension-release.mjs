import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionDir = resolve(root, process.argv[2] || 'public/extension')
const errors = []

function fail(message) {
  errors.push(message)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`Invalid JSON: ${path} (${error.message})`)
    return null
  }
}

function requireFile(relativePath) {
  const path = join(extensionDir, relativePath)
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`Missing required file: ${relativePath}`)
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      walk(path, files)
    } else {
      files.push(path)
    }
  }

  return files
}

function isTextFile(path) {
  return ['.html', '.js', '.json', '.css', '.txt'].includes(extname(path))
}

const manifestPath = join(extensionDir, 'manifest.json')
requireFile('manifest.json')
const manifest = existsSync(manifestPath) ? readJson(manifestPath) : null

if (manifest) {
  if (manifest.manifest_version !== 3) {
    fail('manifest_version must be 3.')
  }

  if (!/^\d+\.\d+\.\d+(\.\d+)?$/.test(String(manifest.version || ''))) {
    fail('manifest version must use Chrome numeric format, for example 0.1.0.')
  }

  if (manifest.default_locale !== 'zh_TW') {
    fail('default_locale should be zh_TW so localized name/description resolve correctly.')
  }

  for (const [size, path] of Object.entries(manifest.icons || {})) {
    requireFile(path)
    if (!['16', '32', '48', '128'].includes(size)) {
      fail(`Unexpected icon size in manifest: ${size}`)
    }
  }

  for (const [size, path] of Object.entries(manifest.action?.default_icon || {})) {
    requireFile(path)
    if (!['16', '32', '48', '128'].includes(size)) {
      fail(`Unexpected action icon size in manifest: ${size}`)
    }
  }

  requireFile(manifest.action?.default_popup || 'popup.html')
  requireFile(manifest.background?.service_worker || 'background.js')
  requireFile(manifest.options_page || 'options.html')

  for (const script of manifest.content_scripts?.flatMap((item) => item.js || []) || []) {
    requireFile(script)
  }
}

for (const required of [
  'content.js',
  'background.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'diagnostics.html',
  'diagnostics.js',
  'extension-i18n.js',
  '_locales/zh_TW/messages.json',
  '_locales/en/messages.json',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
]) {
  requireFile(required)
}

for (const path of walk(extensionDir).filter(isTextFile)) {
  const relative = path.replace(`${extensionDir}/`, '')
  const source = readFileSync(path, 'utf8')

  for (const pattern of ['localhost', '127.0.0.1', '::1', 'http://']) {
    if (source.includes(pattern)) {
      fail(`Forbidden release string "${pattern}" found in ${relative}`)
    }
  }
}

if (errors.length) {
  console.error('Extension release check failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`Extension release check passed: ${extensionDir}`)
