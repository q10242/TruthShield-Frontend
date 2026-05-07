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

chrome.storage.sync.get(defaults, (values) => {
  fields.tooltipOrigin.value = values.tooltipOrigin
  fields.apiOrigin.value = values.apiOrigin
  fields.enableTooltip.checked = values.enableTooltip
  fields.enablePanel.checked = values.enablePanel
  fields.enableReportButton.checked = values.enableReportButton
  document.getElementById('version').textContent = `${t('extensionVersion')} ${chrome.runtime.getManifest().version}`
})

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set({
    tooltipOrigin: fields.tooltipOrigin.value || defaults.tooltipOrigin,
    apiOrigin: fields.apiOrigin.value || defaults.apiOrigin,
    enableTooltip: fields.enableTooltip.checked,
    enablePanel: fields.enablePanel.checked,
    enableReportButton: fields.enableReportButton.checked,
  }, () => {
    document.getElementById('status').textContent = t('saved')
  })
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
