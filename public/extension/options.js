const defaults = {
  tooltipOrigin: 'https://truth-shield.otus.tw',
  apiOrigin: 'https://truth-shield-api.otus.tw',
  enableTooltip: true,
  enablePanel: true,
  locale: 'auto',
}

const fields = {
  tooltipOrigin: document.getElementById('tooltipOrigin'),
  apiOrigin: document.getElementById('apiOrigin'),
  enableTooltip: document.getElementById('enableTooltip'),
  enablePanel: document.getElementById('enablePanel'),
  locale: document.getElementById('locale'),
}
const t = window.truthShieldT || ((key) => key)
const statusCard = document.getElementById('statusCard')
const status = document.getElementById('status')
const version = document.getElementById('version')
let savedSnapshot = null

function resolveSelectedLocale(value) {
  return value === 'zh-TW' || value === 'en'
    ? value
    : (navigator.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en')
}

function currentSettings() {
  return {
    tooltipOrigin: fields.tooltipOrigin.value || defaults.tooltipOrigin,
    apiOrigin: fields.apiOrigin.value || defaults.apiOrigin,
    enableTooltip: fields.enableTooltip.checked,
    enablePanel: fields.enablePanel.checked,
    locale: fields.locale.value || defaults.locale,
  }
}

function applySettings(values) {
  fields.tooltipOrigin.value = values.tooltipOrigin || defaults.tooltipOrigin
  fields.apiOrigin.value = values.apiOrigin || defaults.apiOrigin
  fields.enableTooltip.checked = values.enableTooltip !== false
  fields.enablePanel.checked = values.enablePanel !== false
  fields.locale.value = values.locale || defaults.locale
}

function settingsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function renderVersion() {
  version.textContent = `${t('extensionVersion')} ${chrome.runtime.getManifest().version}`
}

function setStatus(message, state = 'info') {
  statusCard.dataset.state = state
  status.textContent = message
}

function refreshDirtyState(options = {}) {
  const dirty = !savedSnapshot || !settingsEqual(currentSettings(), savedSnapshot)
  document.getElementById('save').disabled = !dirty
  if (dirty) {
    setStatus(t('settingsStatusUnsaved'), 'warn')
    return
  }

  if (!options.preserveMessage) setStatus(t('settingsStatusReady'), 'info')
}

async function initOptions() {
  await window.truthShieldI18nReady
  chrome.storage.sync.get(defaults, (values) => {
    applySettings(values)
    savedSnapshot = currentSettings()
    renderVersion()
    refreshDirtyState()
  })
}

initOptions()

Object.values(fields).forEach((field) => {
  field.addEventListener('input', refreshDirtyState)
  field.addEventListener('change', refreshDirtyState)
})

document.getElementById('save').addEventListener('click', () => {
  const next = currentSettings()
  chrome.storage.sync.set(next, () => {
    window.truthShieldApplyI18n?.(resolveSelectedLocale(next.locale))
    savedSnapshot = { ...next }
    renderVersion()
    setStatus(t('saved'), 'success')
    refreshDirtyState({ preserveMessage: true })
  })
})

document.getElementById('resetDefaults').addEventListener('click', () => {
  chrome.storage.sync.set(defaults, () => {
    applySettings(defaults)
    window.truthShieldApplyI18n?.(resolveSelectedLocale(defaults.locale))
    savedSnapshot = { ...defaults }
    renderVersion()
    setStatus(t('resetDone'), 'success')
    refreshDirtyState({ preserveMessage: true })
  })
})

document.getElementById('exportSettings').addEventListener('click', () => {
  document.getElementById('settingsJson').value = JSON.stringify(currentSettings(), null, 2)
  setStatus(t('settingsExported'), 'success')
})

document.getElementById('importSettings').addEventListener('click', () => {
  try {
    const parsed = JSON.parse(document.getElementById('settingsJson').value)
    const next = {
      tooltipOrigin: parsed.tooltipOrigin || defaults.tooltipOrigin,
      apiOrigin: parsed.apiOrigin || defaults.apiOrigin,
      enableTooltip: parsed.enableTooltip !== false,
      enablePanel: parsed.enablePanel !== false,
      locale: ['auto', 'zh-TW', 'en'].includes(parsed.locale) ? parsed.locale : defaults.locale,
    }
    chrome.storage.sync.set(next, () => {
      applySettings(next)
      window.truthShieldApplyI18n?.(resolveSelectedLocale(next.locale))
      savedSnapshot = { ...next }
      renderVersion()
      setStatus(t('settingsImported'), 'success')
      refreshDirtyState({ preserveMessage: true })
    })
  } catch {
    setStatus(t('settingsImportFailed'), 'error')
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
