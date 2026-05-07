const defaults = {
  tooltipOrigin: 'http://127.0.0.1:15173',
  apiOrigin: 'http://127.0.0.1:18080',
}

const state = {
  settings: defaults,
  tab: null,
}
const t = window.truthShieldT || ((key) => key)

function byId(id) {
  return document.getElementById(id)
}

function setStatus(message, danger = false) {
  byId('status').textContent = message
  byId('status').style.color = danger ? '#fca5a5' : '#86efac'
}

function truthUrl(path, params = {}) {
  const url = new URL(path, state.settings.tooltipOrigin)
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  return url.toString()
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

function currentUrl() {
  return state.tab?.url || ''
}

function currentTitle() {
  return state.tab?.title || ''
}

function openTab(url) {
  chrome.tabs.create({ url })
}

function openWindow(url, width = 460, height = 720) {
  chrome.windows.create({ url, type: 'popup', width, height, focused: true })
}

async function loadSummary() {
  try {
    const response = await fetch(`${state.settings.apiOrigin}/api/extension/summary`, { headers: { Accept: 'application/json' } })
    const payload = await response.json()
    byId('domains').textContent = payload.active_domains ?? '-'
    byId('votes').textContent = payload.votes ?? '-'
  } catch {
    byId('domains').textContent = '!'
    byId('votes').textContent = '!'
  }
}

function bindActions() {
  byId('openHub').addEventListener('click', (event) => {
    event.preventDefault()
    openTab(state.settings.tooltipOrigin)
  })
  byId('openOptions').addEventListener('click', (event) => {
    event.preventDefault()
    chrome.runtime.openOptionsPage()
  })
  byId('openDemo').addEventListener('click', () => openTab(truthUrl('/local-news-demo')))
  byId('openStatus').addEventListener('click', () => openWindow(truthUrl('/iframe-tooltip', { news_url: currentUrl() }), 420, 260))
  byId('openVote').addEventListener('click', () => openWindow(truthUrl('/iframe-vote-panel', { news_url: currentUrl(), expanded: '1' }), 460, 720))
  byId('openReport').addEventListener('click', () => openWindow(truthUrl('/report-domain', { url: currentUrl(), page_title: currentTitle() }), 540, 760))
  byId('openReadiness').addEventListener('click', () => openTab(truthUrl('/vision-readiness')))
  byId('openHealth').addEventListener('click', () => openTab(truthUrl('/health')))
}

chrome.storage.sync.get(defaults, async (settings) => {
  state.settings = settings
  state.tab = await activeTab()

  const url = currentUrl()
  byId('currentUrl').textContent = url || t('unavailableTab')
  const disabled = !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')
  byId('openStatus').disabled = disabled
  byId('openVote').disabled = disabled
  byId('openReport').disabled = disabled
  setStatus(disabled ? t('unsupportedTab') : t('readyStatus'))

  bindActions()
  await loadSummary()
})
