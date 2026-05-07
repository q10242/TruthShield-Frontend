const defaults = {
  tooltipOrigin: 'http://127.0.0.1:15173',
  apiOrigin: 'http://127.0.0.1:18080',
}

const menuItems = [
  {
    id: 'truthshield-link-status',
    title: chrome.i18n.getMessage('linkStatus'),
    contexts: ['link'],
  },
  {
    id: 'truthshield-link-vote',
    title: chrome.i18n.getMessage('linkVote'),
    contexts: ['link'],
  },
  {
    id: 'truthshield-page-status',
    title: chrome.i18n.getMessage('pageStatus'),
    contexts: ['page'],
  },
  {
    id: 'truthshield-page-vote',
    title: chrome.i18n.getMessage('pageVote'),
    contexts: ['page'],
  },
  {
    id: 'truthshield-report-domain',
    title: chrome.i18n.getMessage('reportDomain'),
    contexts: ['page', 'link'],
  },
]

const nonceCache = new Map()

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    menuItems.forEach((item) => chrome.contextMenus.create(item))
  })
}

function getSettings() {
  return chrome.storage.sync.get(defaults)
}

async function extensionRequestHeaders(settings, headers = {}) {
  const nonce = await extensionNonce(settings.apiOrigin)

  if (!nonce?.nonce || !nonce?.signature) {
    return headers
  }

  return {
    ...headers,
    'X-TruthShield-Extension-Nonce': nonce.nonce,
    'X-TruthShield-Extension-Signature': nonce.signature,
  }
}

async function extensionNonce(apiOrigin) {
  const cached = nonceCache.get(apiOrigin)
  if (cached?.expires_at && Date.parse(cached.expires_at) > Date.now() + 30000) {
    return cached
  }

  try {
    const response = await fetch(`${apiOrigin}/api/extension/nonce`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const payload = await response.json()
    nonceCache.set(apiOrigin, payload)
    return payload
  } catch {
    return null
  }
}

function targetUrl(info, tab) {
  return info.linkUrl || info.pageUrl || tab?.url || ''
}

function openTruthShieldWindow(url, width = 440, height = 680) {
  chrome.windows.create({
    url,
    type: 'popup',
    width,
    height,
    focused: true,
  })
}

async function openStatus(url) {
  const settings = await getSettings()
  const target = new URL('/iframe-tooltip', settings.tooltipOrigin)
  target.searchParams.set('news_url', url)
  openTruthShieldWindow(target.toString(), 420, 260)
}

async function openVote(url) {
  const settings = await getSettings()
  const target = new URL('/iframe-vote-panel', settings.tooltipOrigin)
  target.searchParams.set('news_url', url)
  openTruthShieldWindow(target.toString(), 460, 720)
}

async function openReport(url, title = '') {
  const settings = await getSettings()
  const target = new URL('/report-domain', settings.tooltipOrigin)
  target.searchParams.set('url', url)
  target.searchParams.set('page_title', title)
  openTruthShieldWindow(target.toString(), 540, 760)
}

chrome.runtime.onInstalled.addListener(createMenus)
chrome.runtime.onStartup.addListener(createMenus)
createMenus()

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = targetUrl(info, tab)
  if (!url) return

  if (info.menuItemId === 'truthshield-link-status' || info.menuItemId === 'truthshield-page-status') {
    openStatus(url)
    return
  }

  if (info.menuItemId === 'truthshield-link-vote' || info.menuItemId === 'truthshield-page-vote') {
    openVote(url)
    return
  }

  if (info.menuItemId === 'truthshield-report-domain') {
    openReport(url, tab?.title || '')
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'TRUTH_SHIELD_FETCH_STATUS' || !message.url) {
    return false
  }

  getSettings()
    .then(async (settings) => fetch(`${settings.apiOrigin}/api/news/status?url=${encodeURIComponent(message.url)}`, {
      headers: await extensionRequestHeaders(settings, { Accept: 'application/json' }),
    }))
    .then(async (response) => {
      const payload = await response.json().catch(() => null)
      sendResponse({ ok: response.ok, status: response.status, payload })
    })
    .catch((error) => {
      sendResponse({ ok: false, status: 0, message: error?.message || 'fetch failed' })
    })

  return true
})
