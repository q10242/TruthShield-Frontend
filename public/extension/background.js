const defaults = {
  tooltipOrigin: 'https://truth-shield.otus.tw',
  apiOrigin: 'https://truth-shield-api.otus.tw',
  locale: 'auto',
}

const menuDictionaries = {
  'zh-TW': {
    linkStatus: 'TruthShield：查看連結標籤',
    linkVote: 'TruthShield：我已閱讀此連結，提交評分',
    pageStatus: 'TruthShield：查看此頁評分',
    pageVote: 'TruthShield：我已閱讀此頁，提交評分',
    linkPinTimeline: 'TruthShield：Pin 到事件時間線',
    pagePinTimeline: 'TruthShield：Pin 此頁到事件時間線',
    linkPinGraph: 'TruthShield：Pin 到人物/組織關係圖',
    pagePinGraph: 'TruthShield：Pin 此頁到人物/組織關係圖',
    reportDomain: 'TruthShield：回報未收錄新聞站',
  },
  en: {
    linkStatus: 'TruthShield: View link label',
    linkVote: 'TruthShield: I read this link, submit rating',
    pageStatus: 'TruthShield: View this page rating',
    pageVote: 'TruthShield: I read this page, submit rating',
    linkPinTimeline: 'TruthShield: Pin to event timeline',
    pagePinTimeline: 'TruthShield: Pin this page to event timeline',
    linkPinGraph: 'TruthShield: Pin to people/org graph',
    pagePinGraph: 'TruthShield: Pin this page to people/org graph',
    reportDomain: 'TruthShield: Report missing news site',
  },
}

function browserLocale() {
  return chrome.i18n.getUILanguage?.().toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
}

function resolveLocale(setting = 'auto') {
  return setting === 'zh-TW' || setting === 'en' ? setting : browserLocale()
}

const nonceCache = new Map()
const AUTH_STORAGE_KEY = 'truthshieldAuth'
let menuCreationPromise = null

function debugLog(message, payload = null) {
  try {
    if (payload === null || payload === undefined) {
      console.info(`[TruthShield:bg] ${message}`)
    } else {
      console.info(`[TruthShield:bg] ${message}`, payload)
    }
  } catch {
    // Debug logging must never affect extension behavior.
  }
}

function removeAllContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      chrome.runtime.lastError
      resolve()
    })
  })
}

function createContextMenu(item) {
  return new Promise((resolve) => {
    chrome.contextMenus.create(item, () => {
      chrome.runtime.lastError
      resolve()
    })
  })
}

async function createMenus() {
  debugLog('createMenus:start')
  if (menuCreationPromise) {
    debugLog('createMenus:reuse-running')
    return menuCreationPromise
  }

  menuCreationPromise = createMenusNow().finally(() => {
    menuCreationPromise = null
  })

  return menuCreationPromise
}

async function createMenusNow() {
  const settings = await getSettings()
  const dictionary = menuDictionaries[resolveLocale(settings.locale)] || menuDictionaries['zh-TW']
  const menuItems = [
    { id: 'truthshield-link-status', title: dictionary.linkStatus, contexts: ['link'] },
    { id: 'truthshield-link-vote', title: dictionary.linkVote, contexts: ['link'] },
    { id: 'truthshield-page-status', title: dictionary.pageStatus, contexts: ['page'] },
    { id: 'truthshield-page-vote', title: dictionary.pageVote, contexts: ['page'] },
    { id: 'truthshield-link-pin-timeline', title: dictionary.linkPinTimeline, contexts: ['link'] },
    { id: 'truthshield-page-pin-timeline', title: dictionary.pagePinTimeline, contexts: ['page'] },
    { id: 'truthshield-link-pin-graph', title: dictionary.linkPinGraph, contexts: ['link'] },
    { id: 'truthshield-page-pin-graph', title: dictionary.pagePinGraph, contexts: ['page'] },
    { id: 'truthshield-report-domain', title: dictionary.reportDomain, contexts: ['page', 'link'] },
  ]

  await removeAllContextMenus()
  await Promise.all(menuItems.map(createContextMenu))
  debugLog('createMenus:done', { count: menuItems.length })
}

function getSettings() {
  return chrome.storage.sync.get(defaults)
}

function sanitizeStoredAuth(auth = {}) {
  if (!auth?.token) return null

  return {
    token: String(auth.token),
    user: auth.user && typeof auth.user === 'object' ? auth.user : null,
    updatedAt: Number(auth.updatedAt || Date.now()),
  }
}

async function extensionRequestHeaders(settings, headers = {}) {
  const nonce = await extensionNonce(settings.apiOrigin)
  const localizedHeaders = {
    'Accept-Language': resolveLocale(settings.locale),
    ...headers,
  }

  if (!nonce?.nonce || !nonce?.signature) {
    return localizedHeaders
  }

  return {
    ...localizedHeaders,
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
  }, () => {
    if (chrome.runtime.lastError) {
      chrome.tabs.create({ url })
    }
  })
}

async function openStatus(url) {
  const settings = await getSettings()
  const target = new URL('/iframe-tooltip', settings.tooltipOrigin)
  target.searchParams.set('news_url', url)
  if (settings.locale === 'zh-TW' || settings.locale === 'en') target.searchParams.set('locale', settings.locale)
  openTruthShieldWindow(target.toString(), 420, 260)
}

async function openVote(url, tab = null) {
  if (tab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'TRUTH_SHIELD_SHOW_VOTE_PANEL', url })
      if (response?.ok) {
        return
      }
    } catch {
      const injected = await ensureContentScript(tab.id)
      if (injected) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'TRUTH_SHIELD_SHOW_VOTE_PANEL', url })
          if (response?.ok) {
            return
          }
        } catch {
          // Fall through to popup for pages where scripted injection is unavailable.
        }
      }
    }
  }

  const settings = await getSettings()
  const target = new URL('/iframe-vote-panel', settings.tooltipOrigin)
  target.searchParams.set('news_url', url)
  target.searchParams.set('expanded', '1')
  if (settings.locale === 'zh-TW' || settings.locale === 'en') target.searchParams.set('locale', settings.locale)
  openTruthShieldWindow(target.toString(), 460, 720)
}

async function ensureContentScript(tabId) {
  if (!tabId || !chrome.scripting?.executeScript) {
    debugLog('ensureContentScript:unavailable', { tabId })
    return false
  }

  try {
    debugLog('ensureContentScript:start', { tabId })
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    debugLog('ensureContentScript:done', { tabId })
    return true
  } catch {
    debugLog('ensureContentScript:failed', { tabId })
    return false
  }
}

async function openReport(url, title = '') {
  const settings = await getSettings()
  const target = new URL('/report-domain', settings.tooltipOrigin)
  target.searchParams.set('url', url)
  target.searchParams.set('page_title', title)
  if (settings.locale === 'zh-TW' || settings.locale === 'en') target.searchParams.set('locale', settings.locale)
  openTruthShieldWindow(target.toString(), 540, 760)
}

async function openEventPin(url, mode, tab = null) {
  if (tab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'TRUTH_SHIELD_SHOW_EVENT_PIN', url, mode })
      if (response?.ok) return
    } catch {
      const injected = await ensureContentScript(tab.id)
      if (injected) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'TRUTH_SHIELD_SHOW_EVENT_PIN', url, mode })
          if (response?.ok) return
        } catch {
          // Fall through to popup for pages where scripted injection is unavailable.
        }
      }
    }
  }

  const settings = await getSettings()
  const target = new URL('/iframe-event-pin', settings.tooltipOrigin)
  target.searchParams.set('mode', mode)
  target.searchParams.set('news_url', url)
  target.searchParams.set('page_title', tab?.title || '')
  if (settings.locale === 'zh-TW' || settings.locale === 'en') target.searchParams.set('locale', settings.locale)
  openTruthShieldWindow(target.toString(), 460, 720)
}

chrome.runtime.onInstalled.addListener(createMenus)
chrome.runtime.onStartup.addListener(createMenus)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.locale) {
    createMenus()
  }
})
createMenus()

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = targetUrl(info, tab)
  if (!url) return

  if (info.menuItemId === 'truthshield-link-status' || info.menuItemId === 'truthshield-page-status') {
    openStatus(url)
    return
  }

  if (info.menuItemId === 'truthshield-link-vote' || info.menuItemId === 'truthshield-page-vote') {
    openVote(url, tab)
    return
  }

  if (info.menuItemId === 'truthshield-link-pin-timeline' || info.menuItemId === 'truthshield-page-pin-timeline') {
    openEventPin(url, 'timeline', tab)
    return
  }

  if (info.menuItemId === 'truthshield-link-pin-graph' || info.menuItemId === 'truthshield-page-pin-graph') {
    openEventPin(url, 'graph', tab)
    return
  }

  if (info.menuItemId === 'truthshield-report-domain') {
    openReport(url, tab?.title || '')
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'TRUTH_SHIELD_SET_AUTH') {
    const auth = sanitizeStoredAuth(message.auth)
    if (!auth) {
      chrome.storage.local.remove(AUTH_STORAGE_KEY, () => sendResponse({ ok: true, cleared: true }))
      return true
    }

    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: auth }, () => sendResponse({ ok: true }))
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_GET_AUTH') {
    chrome.storage.local.get(AUTH_STORAGE_KEY, (payload) => {
      sendResponse({ ok: true, auth: sanitizeStoredAuth(payload?.[AUTH_STORAGE_KEY]) })
    })
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_CLEAR_AUTH') {
    chrome.storage.local.remove(AUTH_STORAGE_KEY, () => sendResponse({ ok: true }))
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_FETCH_API' && message.path) {
    getSettings()
      .then(async (settings) => {
        const target = new URL(String(message.path), settings.apiOrigin)
        const init = {
          method: message.method || 'GET',
          headers: await extensionRequestHeaders(settings, {
            Accept: 'application/json',
            ...(message.headers || {}),
          }),
        }

        if (message.body !== undefined && message.body !== null) {
          init.body = typeof message.body === 'string' ? message.body : JSON.stringify(message.body)
          init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json'
        }

        return fetch(target.toString(), init)
      })
      .then(async (response) => {
        const payload = await response.json().catch(() => null)
        sendResponse({ ok: response.ok, status: response.status, payload })
      })
      .catch((error) => {
        sendResponse({ ok: false, status: 0, message: error?.message || 'fetch failed' })
      })

    return true
  }

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
