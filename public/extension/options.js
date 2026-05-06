const defaults = {
  tooltipOrigin: 'http://localhost:15173',
  apiOrigin: 'http://localhost:18080',
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

chrome.storage.sync.get(defaults, (values) => {
  fields.tooltipOrigin.value = values.tooltipOrigin
  fields.apiOrigin.value = values.apiOrigin
  fields.enableTooltip.checked = values.enableTooltip
  fields.enablePanel.checked = values.enablePanel
  fields.enableReportButton.checked = values.enableReportButton
  document.getElementById('version').textContent = `Extension version ${chrome.runtime.getManifest().version}`
})

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set({
    tooltipOrigin: fields.tooltipOrigin.value || defaults.tooltipOrigin,
    apiOrigin: fields.apiOrigin.value || defaults.apiOrigin,
    enableTooltip: fields.enableTooltip.checked,
    enablePanel: fields.enablePanel.checked,
    enableReportButton: fields.enableReportButton.checked,
  }, () => {
    document.getElementById('status').textContent = 'Saved'
  })
})

document.getElementById('checkHealth').addEventListener('click', async () => {
  const apiOrigin = fields.apiOrigin.value || defaults.apiOrigin
  const health = document.getElementById('health')
  health.textContent = 'Checking...'

  try {
    const response = await fetch(`${apiOrigin}/api/system/health`, { headers: { Accept: 'application/json' } })
    const payload = await response.json()
    health.textContent = payload.ok ? `Healthy · ${payload.timestamp}` : 'Degraded'
  } catch {
    health.textContent = 'Unable to reach API'
  }
})
