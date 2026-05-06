const defaults = {
  tooltipOrigin: 'http://localhost:15173',
  apiOrigin: 'http://localhost:18080',
}

chrome.storage.sync.get(defaults, async (settings) => {
  document.getElementById('openHub').addEventListener('click', () => chrome.tabs.create({ url: settings.tooltipOrigin }))
  document.getElementById('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage())

  try {
    const response = await fetch(`${settings.apiOrigin}/api/extension/summary`, { headers: { Accept: 'application/json' } })
    const payload = await response.json()
    document.getElementById('domains').textContent = payload.active_domains
    document.getElementById('votes').textContent = payload.votes
  } catch {
    document.getElementById('domains').textContent = '!'
    document.getElementById('votes').textContent = '!'
  }
})
