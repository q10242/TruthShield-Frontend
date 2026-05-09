const defaults = {
  tooltipOrigin: 'https://truth-shield.otus.tw',
  apiOrigin: 'https://truth-shield-api.otus.tw',
  locale: 'auto',
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
  const locale = state.settings.locale === 'zh-TW' || state.settings.locale === 'en'
    ? state.settings.locale
    : ''
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })
  if (locale) url.searchParams.set('locale', locale)

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

function trackPopupEvent(eventType, feature, metadata = {}) {
  try {
    fetch(`${state.settings.apiOrigin}/api/traffic/events`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-TruthShield-Client': 'extension' },
      body: JSON.stringify({
        event_type: eventType,
        source: 'extension',
        feature,
        domain: (() => {
          try { return new URL(currentUrl()).hostname } catch { return '' }
        })(),
        locale: state.settings.locale === 'zh-TW' || state.settings.locale === 'en' ? state.settings.locale : undefined,
        metadata: {
          extension_version: chrome.runtime.getManifest().version,
          ...metadata,
        },
      }),
      keepalive: true,
    }).catch(() => null)
  } catch {
    // Popup analytics should never block user actions.
  }
}

function storedAuth() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'TRUTH_SHIELD_GET_AUTH' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null)
          return
        }

        resolve(response?.auth || null)
      })
    } catch {
      resolve(null)
    }
  })
}

async function loadAuthSummary() {
  const auth = await storedAuth()
  const authStatus = byId('authStatus')
  const authUser = byId('authUser')

  if (auth?.token) {
    const user = auth.user || {}
    authStatus.textContent = t('authSignedIn')
    authStatus.style.color = '#cffafe'
    authUser.textContent = user.display_name || user.name || user.email || t('authHint')
    return
  }

  authStatus.textContent = t('authSignedOut')
  authStatus.style.color = '#fef3c7'
  authUser.textContent = t('authOpenHub')
}

async function currentPageContext() {
  if (!state.tab?.id) {
    return {}
  }

  try {
    const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_GET_PAGE_CONTEXT' })
    return response?.ok ? response : {}
  } catch {
    return {}
  }
}

async function openVotePanel() {
  if (state.tab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_SHOW_VOTE_PANEL', url: currentUrl() })
      if (response?.ok) {
        window.close()
        return
      }
    } catch {
      // Fall through to popup for unsupported pages.
    }
  }

  openWindow(truthUrl('/iframe-vote-panel', { news_url: currentUrl(), expanded: '1' }), 460, 720)
}

async function loadSummary() {
  byId('version').textContent = chrome.runtime.getManifest().version
  try {
    const response = await fetch(`${state.settings.apiOrigin}/api/extension/summary`, { headers: { Accept: 'application/json' } })
    const payload = await response.json()
    byId('domains').textContent = payload.active_domains ?? '-'
    byId('votes').textContent = payload.votes ?? '-'
  } catch {
    byId('domains').textContent = '!'
    byId('votes').textContent = '!'
  }

  try {
    const response = await fetch(`${state.settings.apiOrigin}/api/system/health`, { headers: { Accept: 'application/json' } })
    const payload = await response.json()
    byId('apiStatus').textContent = payload.ok ? t('healthy') : t('degraded')
  } catch {
    byId('apiStatus').textContent = '!'
  }
}

function bindActions() {
  byId('openHub').addEventListener('click', (event) => {
    trackPopupEvent('popup_action', 'open_hub')
    openTab(state.settings.tooltipOrigin)
  })
  byId('openOptions').addEventListener('click', (event) => {
    trackPopupEvent('popup_action', 'open_options')
    chrome.runtime.openOptionsPage()
  })
  byId('openStatus').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_status')
    openWindow(truthUrl('/iframe-tooltip', { news_url: currentUrl() }), 420, 260)
  })
  byId('openVote').addEventListener('click', () => {
    trackPopupEvent('vote_panel_open', 'popup_vote_panel')
    openVotePanel()
  })
  byId('openReport').addEventListener('click', async () => {
    trackPopupEvent('popup_action', 'open_report')
    const context = await currentPageContext()
    openWindow(truthUrl('/report-domain', {
      url: currentUrl(),
      page_title: currentTitle(),
      youtube_channel_url: context.youtubeChannelUrl,
    }), 540, 760)
  })
  byId('openReadiness').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_readiness')
    openTab(truthUrl('/vision-readiness'))
  })
  byId('openHealth').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_health')
    openTab(truthUrl('/health'))
  })
  byId('openBugReport').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_bug_report')
    openWindow(truthUrl('/bug-report', {
      url: currentUrl(),
      title: currentTitle(),
      report_type: 'extension',
      source: 'extension_popup',
      extension_version: chrome.runtime.getManifest().version,
    }), 560, 820)
  })
  byId('openInstall').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_install')
    openTab(truthUrl('/extension-install'))
  })
}

async function initPopup() {
  await window.truthShieldI18nReady

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
    trackPopupEvent('popup_opened', 'popup')
    await loadAuthSummary()
    await loadSummary()
  })
}

initPopup()
