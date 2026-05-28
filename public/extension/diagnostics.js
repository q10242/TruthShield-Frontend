const defaults = {
  tooltipOrigin: 'https://truth-shield.otus.tw',
  apiOrigin: 'https://truth-shield-api.otus.tw',
  enableTooltip: true,
  enablePanel: true,
  locale: 'auto',
}

const t = window.truthShieldT || ((key) => key)

function write(id, value, ok = true) {
  const element = document.getElementById(id)
  element.className = ok ? 'ok' : 'bad'
  element.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function visibleSettings(settings = {}) {
  const { enableReportButton, ...currentSettings } = settings
  return currentSettings
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `${response.status} ${response.statusText}`)
  }

  return payload
}

async function runDiagnostics() {
  const manifest = chrome.runtime.getManifest()
  write('manifest', {
    name: manifest.name,
    version: manifest.version,
    manifest_version: manifest.manifest_version,
    permissions: manifest.permissions || [],
  })

  chrome.storage.sync.get(defaults, async (settings) => {
    write('storage', visibleSettings(settings))

    try {
      const health = await fetchJson(`${settings.apiOrigin}/api/system/health`)
      write('health', health, Boolean(health.ok))
    } catch (error) {
      write('health', `${t('apiUnreachable')}: ${error.message}`, false)
    }

    try {
      const summary = await fetchJson(`${settings.apiOrigin}/api/extension/summary`)
      write('summary', summary)
    } catch (error) {
      write('summary', `${t('apiUnreachable')}: ${error.message}`, false)
    }
  })
}

async function initDiagnostics() {
  await window.truthShieldI18nReady
  document.getElementById('runDiagnostics').addEventListener('click', runDiagnostics)
  runDiagnostics()
}

initDiagnostics()
