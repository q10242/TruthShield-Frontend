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
    linkPinTimeline: 'TruthShield：加入事件時間線',
    pagePinTimeline: 'TruthShield：將此頁加入事件時間線',
    linkPinGraph: 'TruthShield：加入人物/組織關係圖',
    pagePinGraph: 'TruthShield：將此頁加入人物/組織關係圖',
    reportDomain: 'TruthShield：回報未收錄新聞站',
  },
  en: {
    linkStatus: 'TruthShield: View link label',
    linkVote: 'TruthShield: I read this link, submit rating',
    pageStatus: 'TruthShield: View this page rating',
    pageVote: 'TruthShield: I read this page, submit rating',
    linkPinTimeline: 'TruthShield: Add to event timeline',
    pagePinTimeline: 'TruthShield: Add this page to event timeline',
    linkPinGraph: 'TruthShield: Add to people/org graph',
    pagePinGraph: 'TruthShield: Add this page to people/org graph',
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
const apiResponseCache = new Map()
const API_RESPONSE_CACHE_TTL_MS = 10 * 60 * 1000
const API_RESPONSE_STORAGE_KEY = 'truthshield_api_response_cache_v1'
const API_RESPONSE_STORAGE_MAX = 180
const AUTH_STORAGE_KEY = 'truthshieldAuth'
const ONBOARDING_STORAGE_KEY = 'truthshield_onboarding_state_v1'
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

function localGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve))
}

function localSet(values) {
  return new Promise((resolve) => chrome.storage.local.set(values, resolve))
}

async function recordOnboardingStep(step) {
  const payload = await localGet(ONBOARDING_STORAGE_KEY)
  const current = payload?.[ONBOARDING_STORAGE_KEY] || {}
  const completed = new Set(Array.isArray(current.completed_steps) ? current.completed_steps : [])
  completed.add(step)
  await localSet({
    [ONBOARDING_STORAGE_KEY]: {
      version: 1,
      completed_steps: Array.from(completed),
      dismissed_surfaces: Array.isArray(current.dismissed_surfaces) ? current.dismissed_surfaces : [],
      completed_at: current.completed_at || null,
      reward_claimed_at: current.reward_claimed_at || null,
      updated_at: new Date().toISOString(),
    },
  })
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

function cacheableApiResponseKey(target, method, headers = {}) {
  const normalizedMethod = String(method || 'GET').toUpperCase()
  if (normalizedMethod !== 'GET') return null
  if (headers.Authorization || headers.authorization) return null

  if (!cacheableApiResponseTtl(target)) {
    return null
  }

  return [
    target.origin,
    target.pathname,
    normalizedSearch(target),
    headers['Accept-Language'] || headers['accept-language'] || '',
  ].join('|')
}

function cacheableApiResponseTtl(target) {
  if (target.pathname === '/api/news/status' && target.searchParams.has('url')) return 60 * 1000
  if (target.pathname === '/api/reactions/summary' && target.searchParams.has('news_url')) return 60 * 1000
  if (target.pathname === '/api/tags') return 6 * 60 * 60 * 1000
  if (target.pathname === '/api/events/options') return 6 * 60 * 60 * 1000
  if (target.pathname === '/api/news-domains') return 6 * 60 * 60 * 1000
  if (target.pathname === '/api/youtube-channels') return 6 * 60 * 60 * 1000
  if (target.pathname === '/api/journalists/cache') return 24 * 60 * 60 * 1000

  return 0
}

function normalizedSearch(target) {
  const copy = new URL(target.toString())
  const entries = [...copy.searchParams.entries()].sort(([aKey, aValue], [bKey, bValue]) => {
    const keyCompare = aKey.localeCompare(bKey)
    return keyCompare || aValue.localeCompare(bValue)
  })

  copy.search = ''
  for (const [key, value] of entries) {
    copy.searchParams.append(key, value)
  }

  return copy.search
}

async function cachedApiResponse(cacheKey) {
  const cached = apiResponseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response
  }

  if (cached) {
    apiResponseCache.delete(cacheKey)
  }

  const store = await localGet(API_RESPONSE_STORAGE_KEY)
  const persisted = store?.[API_RESPONSE_STORAGE_KEY]?.[cacheKey]
  if (!persisted || Number(persisted.expiresAt || 0) <= Date.now()) {
    if (persisted) await forgetPersistentApiResponse(cacheKey)
    return null
  }

  apiResponseCache.set(cacheKey, {
    response: persisted.response,
    expiresAt: Number(persisted.expiresAt),
  })

  return persisted.response
}

async function rememberApiResponse(cacheKey, response, ttlMs = API_RESPONSE_CACHE_TTL_MS) {
  const expiresAt = Date.now() + ttlMs
  apiResponseCache.set(cacheKey, {
    response,
    expiresAt,
  })

  try {
    const payload = await localGet(API_RESPONSE_STORAGE_KEY)
    const existing = payload?.[API_RESPONSE_STORAGE_KEY] || {}
    const next = {
      ...existing,
      [cacheKey]: {
        response,
        expiresAt,
        cachedAt: Date.now(),
      },
    }
    const entries = Object.entries(next)
      .filter(([, value]) => Number(value?.expiresAt || 0) > Date.now())
      .sort(([, a], [, b]) => Number(b?.cachedAt || 0) - Number(a?.cachedAt || 0))
      .slice(0, API_RESPONSE_STORAGE_MAX)

    await localSet({ [API_RESPONSE_STORAGE_KEY]: Object.fromEntries(entries) })
  } catch {
    // Persistent cache is an optimization; memory cache is enough if storage fails.
  }
}

async function forgetPersistentApiResponse(cacheKey) {
  try {
    const payload = await localGet(API_RESPONSE_STORAGE_KEY)
    const current = payload?.[API_RESPONSE_STORAGE_KEY] || {}
    if (!current[cacheKey]) return
    delete current[cacheKey]
    await localSet({ [API_RESPONSE_STORAGE_KEY]: current })
  } catch {
    // Cache cleanup must not affect extension behavior.
  }
}

async function clearApiResponseCacheForUrl(url) {
  const target = String(url || '')
  if (!target) return

  for (const key of [...apiResponseCache.keys()]) {
    if (key.includes(encodeURIComponent(target)) || key.includes(target)) {
      apiResponseCache.delete(key)
    }
  }

  try {
    const payload = await localGet(API_RESPONSE_STORAGE_KEY)
    const current = payload?.[API_RESPONSE_STORAGE_KEY] || {}
    let changed = false
    for (const key of Object.keys(current)) {
      if (key.includes(encodeURIComponent(target)) || key.includes(target)) {
        delete current[key]
        changed = true
      }
    }
    if (changed) {
      await localSet({ [API_RESPONSE_STORAGE_KEY]: current })
    }
  } catch {
    // Best-effort cache invalidation.
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

chrome.runtime.onInstalled.addListener((details) => {
  createMenus()
  recordOnboardingStep('install_extension').catch(() => null)
  if (details?.reason === 'install') {
    getSettings()
      .then((settings) => chrome.tabs.create({ url: `${settings.tooltipOrigin}/onboarding?source=extension` }))
      .catch(() => null)
  }
})
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

  if (message?.type === 'TRUTH_SHIELD_CLEAR_URL_CACHE') {
    clearApiResponseCacheForUrl(message.url)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }))
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_FETCH_API' && message.path) {
    getSettings()
      .then(async (settings) => {
        const target = new URL(String(message.path), settings.apiOrigin)
        const method = message.method || 'GET'

        if (String(method).toUpperCase() === 'GET' && target.pathname === '/api/extension/nonce' && !target.search) {
          const payload = await extensionNonce(settings.apiOrigin)
          return {
            ok: Boolean(payload),
            status: payload ? 200 : 0,
            payload,
            fromInternalCache: true,
          }
        }

        const baseHeaders = {
          Accept: 'application/json',
          ...(message.headers || {}),
        }
        const cacheKey = cacheableApiResponseKey(target, method, baseHeaders)
        const cached = cacheKey ? await cachedApiResponse(cacheKey) : null
        if (cached) {
          return { ...cached, fromInternalCache: true }
        }

        const init = {
          method,
          headers: await extensionRequestHeaders(settings, baseHeaders),
        }

        if (message.body !== undefined && message.body !== null) {
          init.body = typeof message.body === 'string' ? message.body : JSON.stringify(message.body)
          init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json'
        }

        const response = await fetch(target.toString(), init)
        const payload = await response.json().catch(() => null)
        const result = { ok: response.ok, status: response.status, payload }
        if (cacheKey && response.ok) {
          await rememberApiResponse(cacheKey, result, cacheableApiResponseTtl(target))
        }

        return result
      })
      .then((response) => {
        sendResponse(response)
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
    .then(async (settings) => {
      const target = new URL('/api/news/status', settings.apiOrigin)
      target.searchParams.set('url', message.url)
      const baseHeaders = { Accept: 'application/json', 'Accept-Language': resolveLocale(settings.locale) }
      const cacheKey = cacheableApiResponseKey(target, 'GET', baseHeaders)
      const cached = cacheKey ? await cachedApiResponse(cacheKey) : null
      if (cached) {
        return { ...cached, fromInternalCache: true }
      }

      const response = await fetch(target.toString(), {
        headers: await extensionRequestHeaders(settings, baseHeaders),
      })
      const payload = await response.json().catch(() => null)
      const result = { ok: response.ok, status: response.status, payload }
      if (cacheKey && response.ok) {
        await rememberApiResponse(cacheKey, result, cacheableApiResponseTtl(target))
      }

      return result
    })
    .then((response) => {
      sendResponse(response)
    })
    .catch((error) => {
      sendResponse({ ok: false, status: 0, message: error?.message || 'fetch failed' })
    })

  return true
})
