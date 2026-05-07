const defaults = {
  tooltipOrigin: 'http://127.0.0.1:15173',
  apiOrigin: 'http://127.0.0.1:18080',
  enableTooltip: true,
  enablePanel: true,
  enableReportButton: true,
}

const fields = {
  tooltipOrigin: document.getElementById('tooltipOrigin'),
  apiOrigin: document.getElementById('apiOrigin'),
  enableTooltip: document.getElementById('enableTooltip'),
  enablePanel: document.getElementById('enablePanel'),
  enableReportButton: document.getElementById('enableReportButton'),
}
const t = window.truthShieldT || ((key) => key)

function currentSettings() {
  return {
    tooltipOrigin: fields.tooltipOrigin.value || defaults.tooltipOrigin,
    apiOrigin: fields.apiOrigin.value || defaults.apiOrigin,
    enableTooltip: fields.enableTooltip.checked,
    enablePanel: fields.enablePanel.checked,
    enableReportButton: fields.enableReportButton.checked,
  }
}

function applySettings(values) {
  fields.tooltipOrigin.value = values.tooltipOrigin || defaults.tooltipOrigin
  fields.apiOrigin.value = values.apiOrigin || defaults.apiOrigin
  fields.enableTooltip.checked = values.enableTooltip !== false
  fields.enablePanel.checked = values.enablePanel !== false
  fields.enableReportButton.checked = values.enableReportButton !== false
}

chrome.storage.sync.get(defaults, (values) => {
  applySettings(values)
  document.getElementById('version').textContent = `${t('extensionVersion')} ${chrome.runtime.getManifest().version}`
})

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set(currentSettings(), () => {
    document.getElementById('status').textContent = t('saved')
  })
})

document.getElementById('resetDefaults').addEventListener('click', () => {
  chrome.storage.sync.set(defaults, () => {
    applySettings(defaults)
    document.getElementById('status').textContent = t('resetDone')
  })
})

document.getElementById('exportSettings').addEventListener('click', () => {
  document.getElementById('settingsJson').value = JSON.stringify(currentSettings(), null, 2)
  document.getElementById('status').textContent = t('settingsExported')
})

document.getElementById('importSettings').addEventListener('click', () => {
  try {
    const parsed = JSON.parse(document.getElementById('settingsJson').value)
    const next = {
      tooltipOrigin: parsed.tooltipOrigin || defaults.tooltipOrigin,
      apiOrigin: parsed.apiOrigin || defaults.apiOrigin,
      enableTooltip: parsed.enableTooltip !== false,
      enablePanel: parsed.enablePanel !== false,
      enableReportButton: parsed.enableReportButton !== false,
    }
    chrome.storage.sync.set(next, () => {
      applySettings(next)
      document.getElementById('status').textContent = t('settingsImported')
    })
  } catch {
    document.getElementById('status').textContent = t('settingsImportFailed')
  }
})

document.getElementById('openDiagnostics').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('diagnostics.html') })
})

document.getElementById('checkHealth').addEventListener('click', async () => {
  const apiOrigin = fields.apiOrigin.value || defaults.apiOrigin
  const health = document.getElementById('health')
  health.textContent = t('checking')

  try {
    const response = await fetch(`${apiOrigin}/api/system/health`, { headers: { Accept: 'application/json' } })
    const payload = await response.json()
    health.textContent = payload.ok ? `${t('healthy')} · ${payload.timestamp}` : t('degraded')
  } catch {
    health.textContent = t('apiUnreachable')
  }
})

document.getElementById('checkWeb').addEventListener('click', async () => {
  const webOrigin = fields.tooltipOrigin.value || defaults.tooltipOrigin
  const webHealth = document.getElementById('webHealth')
  webHealth.textContent = t('checking')

  try {
    const response = await fetch(`${webOrigin}/vision-readiness`, { method: 'GET' })
    webHealth.textContent = response.ok ? t('healthy') : t('degraded')
  } catch {
    webHealth.textContent = t('apiUnreachable')
  }
})
