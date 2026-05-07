const defaults = {
  tooltipOrigin: 'http://127.0.0.1:15173',
  apiOrigin: 'http://127.0.0.1:18080',
}

const state = {
  settings: defaults,
  tab: null,
}

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
  byId('openHub').addEventListener('click', () => openTab(state.settings.tooltipOrigin))
  byId('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage())
  byId('openDemo').addEventListener('click', () => openTab(truthUrl('/local-news-demo')))

  byId('openStatus').addEventListener('click', () => {
    if (!currentUrl()) return
    openWindow(truthUrl('/iframe-tooltip', { news_url: currentUrl() }), 420, 260)
  })

  byId('openVote').addEventListener('click', () => {
    if (!currentUrl()) return
    openWindow(truthUrl('/iframe-vote-panel', { news_url: currentUrl() }), 460, 720)
  })

  byId('reportDomain').addEventListener('click', () => {
    if (!currentUrl()) return
    openWindow(truthUrl('/report-domain', { url: currentUrl(), page_title: currentTitle() }), 540, 760)
  })

  byId('showInlinePanel').addEventListener('click', async () => {
    if (!state.tab?.id) return

    try {
      const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_SHOW_VOTE_PANEL' })
      setStatus(response?.ok ? '已在目前頁面顯示 TruthShield 橫幅 / 面板' : '目前頁面無法注入面板', !response?.ok)
    } catch {
      setStatus('目前頁面無法注入面板，請改用彈出投票視窗', true)
    }
  })
}

chrome.storage.sync.get(defaults, async (settings) => {
  state.settings = settings
  state.tab = await activeTab()

  const url = currentUrl()
  byId('currentUrl').textContent = url || '無法取得目前分頁'
  const disabled = !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')
  const pageActionIds = ['openStatus', 'openVote', 'showInlinePanel', 'reportDomain']
  pageActionIds.forEach((id) => {
    byId(id).disabled = disabled
  })

  bindActions()
  await loadSummary()
})
