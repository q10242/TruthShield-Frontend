let TOOLTIP_ORIGIN = 'https://truth-shield.otus.tw'
let API_ORIGIN = 'https://truth-shield-api.otus.tw'
const DEBUG_LOG = true
const HOVER_DELAY_MS = 300
const TOOLTIP_STATUS_CACHE_TTL_MS = 5 * 60 * 1000
const TOOLTIP_STATUS_CACHE_MAX = 250
const TELEMETRY_CACHE_TTL_MS = 5 * 60 * 1000
const TELEMETRY_CACHE_MAX = 300
const TELEMETRY_BATCH_MAX = 20
const TELEMETRY_FLUSH_DELAY_MS = 5000
const VOTE_PANEL_POSITION_KEY = 'truthShieldVotePanelPosition'
const AUTH_TOKEN_KEY = 'truthshield_api_token'
const AUTH_USER_KEY = 'truthshield_user'
let enableTooltip = true
let enablePanel = true
let enableReportButton = true
let contentLocale = navigator.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
const FALLBACK_NEWS_DOMAINS = [
  '127.0.0.1',
  'localhost',
  'cna.com.tw',
  'www.cna.com.tw',
  'news.pts.org.tw',
  'www.cw.com.tw',
  'www.businessweekly.com.tw',
  'udn.com',
  'www.chinatimes.com',
  'ctinews.com',
  'www.ctinews.com',
  'news.cts.com.tw',
  'www.ettoday.net',
  'www.setn.com',
  'news.ltn.com.tw',
  'tw.news.yahoo.com',
  'www.storm.mg',
  'www.thenewslens.com',
  'www.mirrormedia.mg',
  'www.rti.org.tw',
  'www.ftvnews.com.tw',
  'news.tvbs.com.tw',
  'www.nownews.com',
  'www.taisounds.com',
  'www.upmedia.mg',
  'www.businesstoday.com.tw',
  'finance.ettoday.net',
  'www.peoplenews.tw',
  'news.ebc.net.tw',
  'www.nexttv.com.tw',
  'www.taiwannews.com.tw',
  'english.cw.com.tw',
  'www.taiwanplus.com',
  'www.taipeitimes.com',
  'www.mnews.tw',
  'www.cmmedia.com.tw',
]
const FALLBACK_YOUTUBE_CHANNELS = [
  { handle: null, channelId: null, channelUrl: 'https://www.youtube.com/user/cnataiwan' },
  { handle: 'PNNPTS' },
  { handle: 'TVBSNEWS01' },
  { handle: 'setnews' },
  { handle: 'FTVCP' },
  { handle: 'ETtoday' },
  { handle: 'LTNNews' },
  { handle: 'ChinaTimes' },
  { handle: 'udnvideo' },
  { handle: 'RTIofficial' },
  { handle: null, channelId: 'UCpu3bemTQwAU8PqM4kJdoEQ', channelUrl: 'https://www.youtube.com/channel/UCpu3bemTQwAU8PqM4kJdoEQ' },
  { handle: 'newsebc', channelId: 'UCR3asjvr_WAaxwJYEDV_Bfw' },
  { handle: 'CNN' },
  { handle: 'BBCNews' },
  { handle: 'Reuters' },
  { handle: 'AssociatedPress' },
  { handle: 'aljazeeraenglish' },
  { handle: 'dwnews' },
  { handle: 'France24_en' },
  { handle: 'SkyNews' },
  { handle: 'PBSNewsHour' },
  { handle: 'ABCNews' },
  { handle: 'CBSNews' },
  { handle: 'NBCNews' },
  { handle: 'NHKWORLDJAPAN' },
  { handle: 'channelnewsasia' },
  { handle: 'SouthChinaMorningPost' },
]

let newsDomains = [...FALLBACK_NEWS_DOMAINS]
let domainConfigs = []
let youtubeChannels = FALLBACK_YOUTUBE_CHANNELS.map(normalizeYoutubeChannelRecord).filter(Boolean)
let extensionNonce = null
let tooltipBox = null
const tooltipStatusCache = new Map()
const tooltipStatusRequests = new Map()
const telemetryCache = new Map()
const telemetryQueue = []
let telemetryFlushTimer = null
let articleBanner = null
let articleBannerUrl = ''
let articleBannerDismissed = false
const articleBannerStatusCache = new Map()
const articleBannerStatusRequests = new Map()
const articleBannerReportedUrls = new Set()
const articleBannerSkippedUrls = new Set()
let votePanelFrame = null
let votePanelBackdrop = null
let votePanelShell = null
let votePanelUrl = ''
let votePanelPosition = null
let votePanelCollapsed = false
let votePanelDrag = null
let reportButton = null
let activeAnchor = null
let hideTimer = null
let hoverTimer = null
let articleReadSeconds = 0
let articleReadTimer = null

function debugLog(message, payload = null) {
  if (!DEBUG_LOG) return

  try {
    if (payload === null || payload === undefined) {
      console.info(`[TruthShield] ${message}`)
    } else {
      console.info(`[TruthShield] ${message}`, payload)
    }
  } catch {
    // Debug logging must never affect page behavior.
  }
}

debugLog('content script bootstrap', {
  href: window.location.href,
  hostname: window.location.hostname,
  readyState: document.readyState,
})
const contentMessages = {
  'zh-TW': {
    checkingLink: '正在查核此連結...',
    tagUnavailable: '暫時無法取得標籤',
    noData: '尚無足夠投票資料',
    finalized: '已定案',
    voteClosed: '投票已截止',
    tooltipHint: 'TruthShield 標籤提示',
    checking: '檢查中',
    live: '即時',
    newsStatus: 'TruthShield 新聞狀態',
    checkingNews: '正在查核此新聞...',
    ratingUnavailable: '暫時無法取得 TruthShield 評分',
    resultFinalized: '結果已定案',
    readEvidence: '閱讀後可補充證據',
    open: '開啟',
    closeBanner: '關閉 TruthShield 橫幅',
    closePanel: '關閉 TruthShield 投票面板',
    votePanelTitle: 'TruthShield 新聞投票面板',
    reportMissing: '回報未收錄新聞站',
  },
  en: {
    checkingLink: 'Checking this link...',
    tagUnavailable: 'Label temporarily unavailable',
    noData: 'Not enough voting data yet',
    finalized: 'Finalized',
    voteClosed: 'Voting closed',
    tooltipHint: 'TruthShield label hint',
    checking: 'Checking',
    live: 'Live',
    newsStatus: 'TruthShield news status',
    checkingNews: 'Checking this article...',
    ratingUnavailable: 'TruthShield rating temporarily unavailable',
    resultFinalized: 'Result finalized',
    readEvidence: 'Add evidence after reading',
    open: 'Open',
    closeBanner: 'Close TruthShield banner',
    closePanel: 'Close TruthShield vote panel',
    votePanelTitle: 'TruthShield news vote panel',
    reportMissing: 'Report missing news site',
  },
}

function t(key) {
  return contentMessages[contentLocale]?.[key] || contentMessages['zh-TW'][key] || key
}

function extensionVersion() {
  try {
    return chrome.runtime?.getManifest?.().version || null
  } catch {
    return null
  }
}

function isTruthShieldWebOrigin() {
  return sameOrigin(window.location.origin, TOOLTIP_ORIGIN)
}

function sameOrigin(left, right) {
  try {
    return new URL(left).origin === new URL(right).origin
  } catch {
    return false
  }
}

function tooltipOrigin() {
  try {
    return new URL(TOOLTIP_ORIGIN).origin
  } catch {
    return TOOLTIP_ORIGIN
  }
}

function readWebAuthFromLocalStorage() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || ''
  if (!token) return null

  let user = null
  try {
    user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null')
  } catch {
    user = null
  }

  return { token, user, updatedAt: Date.now() }
}

function installPageAuthBridge() {
  // Older builds injected an inline page script here to read page auth. That
  // violates strict site CSP on some news sites and is no longer needed because
  // content scripts can read localStorage on the TruthShield origin directly.
}

function requestPageAuthState() {
  if (!isTruthShieldWebOrigin()) return

  syncWebAuthToExtensionStorage()
}

function clearWebAuthState() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    window.postMessage({ type: 'TRUTH_SHIELD_AUTH_CLEARED' }, window.location.origin)
  } catch {
    // Ignore pages that disallow localStorage access.
  }
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime?.sendMessage?.(message, (response) => {
        if (chrome.runtime?.lastError) {
          resolve(null)
          return
        }

        resolve(response || null)
      })
    } catch {
      resolve(null)
    }
  })
}

async function syncWebAuthToExtensionStorage() {
  if (!isTruthShieldWebOrigin()) return

  const auth = readWebAuthFromLocalStorage()
  if (!auth) {
    requestPageAuthState()
    return
  }

  await sendRuntimeMessage({ type: 'TRUTH_SHIELD_SET_AUTH', auth })
}

async function storedExtensionAuth() {
  const response = await sendRuntimeMessage({ type: 'TRUTH_SHIELD_GET_AUTH' })
  return response?.auth || null
}

async function postStoredAuthToVotePanelFrame() {
  if (!votePanelFrame?.contentWindow) return

  const auth = await storedExtensionAuth()
  if (!auth?.token || !votePanelFrame?.contentWindow) return

  votePanelFrame.contentWindow.postMessage(
    {
      type: 'TRUTH_SHIELD_AUTH_UPDATED',
      source: 'truthshield-extension',
      token: auth.token,
      user: auth.user || null,
    },
    tooltipOrigin(),
  )
}

async function loadExtensionNonce() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/extension/nonce`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      extensionNonce = null
      return
    }

    extensionNonce = await response.json()
  } catch {
    extensionNonce = null
  }
}

function extensionRequestHeaders(headers = {}) {
  const requestHeaders = { 'Accept-Language': contentLocale, ...headers }
  if (extensionNonce?.nonce && extensionNonce?.signature) {
    requestHeaders['X-TruthShield-Extension-Nonce'] = extensionNonce.nonce
    requestHeaders['X-TruthShield-Extension-Signature'] = extensionNonce.signature
  }

  return requestHeaders
}

function reportExtensionEvent(eventType, success = true, metadata = {}) {
  try {
    if (shouldSkipTelemetry(eventType, success, metadata)) {
      return
    }

    telemetryQueue.push({
      domain: window.location.hostname,
      event_type: eventType,
      extension_version: extensionVersion(),
      success,
      metadata,
    })

    if (telemetryQueue.length >= TELEMETRY_BATCH_MAX) {
      flushExtensionTelemetry()
      return
    }

    scheduleTelemetryFlush()
  } catch {
    // Telemetry must never break page behavior.
  }
}

function scheduleTelemetryFlush() {
  if (telemetryFlushTimer) {
    return
  }

  telemetryFlushTimer = window.setTimeout(flushExtensionTelemetry, TELEMETRY_FLUSH_DELAY_MS)
}

function flushExtensionTelemetry() {
  window.clearTimeout(telemetryFlushTimer)
  telemetryFlushTimer = null

  if (telemetryQueue.length === 0) {
    return
  }

  const events = telemetryQueue.splice(0, TELEMETRY_BATCH_MAX)
  const payload = JSON.stringify({ events })
  const url = `${API_ORIGIN}/api/extension/events/batch`
  flushTrafficTelemetry(events)

  try {
    if (navigator.sendBeacon && !extensionNonce?.nonce) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(url, blob)) {
        return
      }
    }

    fetch(url, {
      method: 'POST',
      headers: extensionRequestHeaders({ Accept: 'application/json', 'Content-Type': 'application/json' }),
      body: payload,
      keepalive: true,
    }).catch(() => null)
  } catch {
    // Dropping telemetry is acceptable; page behavior is more important.
  }
}

function flushTrafficTelemetry(events) {
  const trafficEvents = events
    .map((event) => {
      const eventType = trafficEventType(event.event_type)
      if (!eventType) return null

      return {
        event_type: eventType,
        source: 'extension',
        feature: trafficFeature(event.event_type),
        domain: event.metadata?.href_host || event.domain,
        success: event.success,
        locale: contentLocale,
        metadata: {
          extension_version: event.extension_version,
          mode: event.metadata?.mode,
          reason: event.metadata?.reason,
        },
      }
    })
    .filter(Boolean)

  if (!trafficEvents.length) {
    return
  }

  const payload = JSON.stringify({ events: trafficEvents })
  const url = `${API_ORIGIN}/api/traffic/events/batch`

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      if (navigator.sendBeacon(url, blob)) {
        return
      }
    }

    fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-TruthShield-Client': 'extension' },
      body: payload,
      keepalive: true,
    }).catch(() => null)
  } catch {
    // Traffic telemetry must never affect the page.
  }
}

function trafficEventType(extensionEventType) {
  return {
    tooltip_shown: 'tooltip_view',
    article_banner_injected: 'banner_view',
    vote_panel_opened: 'vote_panel_open',
    article_banner_skipped: 'banner_skipped',
    news_domains_loaded: 'extension_domains_loaded',
    news_domains_failed: 'extension_domains_failed',
  }[extensionEventType] || null
}

function trafficFeature(extensionEventType) {
  if (extensionEventType.startsWith('tooltip')) return 'tooltip'
  if (extensionEventType.startsWith('article_banner')) return 'article_banner'
  if (extensionEventType.startsWith('vote_panel')) return 'vote_panel'
  if (extensionEventType.startsWith('news_domains')) return 'extension_boot'

  return 'extension'
}

function shouldSkipTelemetry(eventType, success, metadata) {
  const key = telemetryKey(eventType, success, metadata)
  const cachedAt = telemetryCache.get(key)
  const now = Date.now()

  if (cachedAt && now - cachedAt < TELEMETRY_CACHE_TTL_MS) {
    return true
  }

  telemetryCache.set(key, now)

  if (telemetryCache.size > TELEMETRY_CACHE_MAX) {
    const oldestKey = telemetryCache.keys().next().value
    if (oldestKey) telemetryCache.delete(oldestKey)
  }

  return false
}

function telemetryKey(eventType, success, metadata) {
  const hrefHost = metadata?.href_host || ''
  const reason = metadata?.reason || ''
  const mode = metadata?.mode || ''
  const pageKey = eventType === 'tooltip_shown' ? hrefHost : window.location.href

  return [eventType, success ? '1' : '0', window.location.hostname, pageKey, reason, mode].join('|')
}

function reportSelectorCheck(checkType, success, selector = null, metadata = {}) {
  try {
    fetch(`${API_ORIGIN}/api/extension/selector-checks`, {
      method: 'POST',
      headers: extensionRequestHeaders({ Accept: 'application/json', 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        domain: window.location.hostname,
        check_type: checkType,
        success,
        selector,
        metadata,
      }),
    }).catch(() => null)
  } catch {
    // Selector telemetry must never affect page behavior.
  }
}

async function loadNewsDomains() {
  debugLog('loadNewsDomains:start', { apiOrigin: API_ORIGIN })
  try {
    const response = await fetch(`${API_ORIGIN}/api/news-domains`, {
      headers: extensionRequestHeaders({ Accept: 'application/json' }),
    })

    if (!response.ok) {
      debugLog('loadNewsDomains:bad-response', { status: response.status })
      return
    }

    const payload = await response.json()
    const domains = Array.isArray(payload.data)
      ? payload.data.map((item) => item.domain).filter(Boolean)
      : []

    if (domains.length > 0) {
      newsDomains = [...new Set([...FALLBACK_NEWS_DOMAINS, ...domains])]
      domainConfigs = [
        ...FALLBACK_NEWS_DOMAINS.map((domain) => ({ domain })),
        ...payload.data,
      ]
      debugLog('loadNewsDomains:success', { count: newsDomains.length, matched: newsDomains.includes(window.location.hostname) })
    }
  } catch {
    newsDomains = [...FALLBACK_NEWS_DOMAINS]
    debugLog('loadNewsDomains:failed-fallback', { count: newsDomains.length, matched: newsDomains.includes(window.location.hostname) })
  }
}

async function loadYoutubeChannels() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/youtube-channels`, {
      headers: extensionRequestHeaders({ Accept: 'application/json' }),
    })

    if (!response.ok) {
      return
    }

    const payload = await response.json()
    const remoteChannels = Array.isArray(payload.data)
      ? payload.data.map(normalizeYoutubeChannelRecord).filter(Boolean)
      : []

    youtubeChannels = mergeYoutubeChannels([...youtubeChannels, ...remoteChannels])
  } catch {
    youtubeChannels = FALLBACK_YOUTUBE_CHANNELS.map(normalizeYoutubeChannelRecord).filter(Boolean)
  }
}

async function loadSettings() {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
    return
  }

  const settings = await chrome.storage.sync.get({
    tooltipOrigin: TOOLTIP_ORIGIN,
    apiOrigin: API_ORIGIN,
    enableTooltip: true,
    enablePanel: true,
    enableReportButton: true,
    locale: 'auto',
  })

  TOOLTIP_ORIGIN = settings.tooltipOrigin
  API_ORIGIN = settings.apiOrigin
  enableTooltip = settings.enableTooltip
  enablePanel = settings.enablePanel
  enableReportButton = settings.enableReportButton
  contentLocale = settings.locale === 'zh-TW' || settings.locale === 'en'
    ? settings.locale
    : (navigator.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en')
}

function isNewsLink(anchor) {
  try {
    const url = new URL(anchor.href)
    if (isYouTubeHostname(url.hostname)) {
      return isActiveYoutubeChannelUrl(url.toString())
    }

    return isNewsHostname(url.hostname)
  } catch {
    return false
  }
}

function isNewsHostname(hostname) {
  if (isYouTubeHostname(hostname)) {
    return isCurrentYouTubeNewsPage()
  }

  const matched = newsDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  debugLog('isNewsHostname', { hostname, matched })
  return matched
}

function isCurrentNewsPage() {
  return isNewsHostname(window.location.hostname)
}

function isLikelyArticlePage() {
  if (isYouTubeVideoPage()) {
    return isCurrentYouTubeNewsPage()
  }

  const matchedConfig = domainConfigs.find((config) => window.location.hostname === config.domain || window.location.hostname.endsWith(`.${config.domain}`))
  debugLog('isLikelyArticlePage:start', {
    href: window.location.href,
    matchedConfig: matchedConfig?.domain || '',
    path: window.location.pathname,
  })
  if (matchedConfig?.blocked_path_pattern) {
    try {
      if (new RegExp(matchedConfig.blocked_path_pattern).test(window.location.pathname)) {
        debugLog('isLikelyArticlePage:false-blocked-path', { pattern: matchedConfig.blocked_path_pattern })
        return false
      }
    } catch {
      // Invalid admin-provided patterns are ignored client-side.
    }
  }

  if (matchedConfig?.list_url_pattern) {
    try {
      if (new RegExp(matchedConfig.list_url_pattern).test(window.location.pathname)) {
        debugLog('isLikelyArticlePage:false-list-pattern', { pattern: matchedConfig.list_url_pattern })
        return false
      }
    } catch {
      // Invalid admin-provided patterns are ignored client-side.
    }
  }

  if (matchedConfig?.article_url_pattern) {
    try {
      if (new RegExp(matchedConfig.article_url_pattern).test(window.location.pathname)) {
        debugLog('isLikelyArticlePage:true-article-pattern', { pattern: matchedConfig.article_url_pattern })
        return true
      }
    } catch {
      // Invalid admin-provided patterns are ignored client-side.
    }
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean)
  const path = window.location.pathname.toLowerCase()
  const listLikePath = /^\/?$/.test(path) || /\/(category|section|topics?|search|tag|author|latest|realtime|archive)(\/|$)/.test(path)
  if (listLikePath) {
    debugLog('isLikelyArticlePage:false-list-like-path', { path })
    return false
  }

  const fileLikeArticle = /\.(?:html?|shtml)$/i.test(path)
  const likely = fileLikeArticle || pathParts.length >= 2 || path.includes('news')
  debugLog('isLikelyArticlePage:fallback-result', { likely, fileLikeArticle, pathPartsLength: pathParts.length, path })
  return likely
}

function isYouTubeVideoPage() {
  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname.toLowerCase()

  if (host === 'youtu.be') {
    return path.split('/').filter(Boolean).length >= 1
  }

  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    return false
  }

  return (path === '/watch' && new URLSearchParams(window.location.search).has('v'))
    || path.startsWith('/shorts/')
    || path.startsWith('/live/')
}

function isYouTubeHostname(hostname) {
  const host = String(hostname || '').toLowerCase()

  return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host)
}

function normalizeYoutubeHandle(handle) {
  return String(handle || '').trim().replace(/^@/, '').toLowerCase()
}

function normalizeYoutubeChannelRecord(channel) {
  const handle = normalizeYoutubeHandle(channel?.handle)
  const channelId = String(channel?.channel_id || '').trim()
  const channelUrl = channel?.channel_url ? canonicalYoutubeChannelUrl(channel.channel_url) : ''

  if (!handle && !channelId && !channelUrl) {
    return null
  }

  return { handle, channelId, channelUrl }
}

function mergeYoutubeChannels(channels) {
  const merged = new Map()

  for (const channel of channels) {
    if (!channel) continue
    const key = channel.channelId
      ? `id:${channel.channelId}`
      : (channel.handle ? `handle:${channel.handle}` : `url:${channel.channelUrl}`)
    merged.set(key, channel)
  }

  return [...merged.values()]
}

function canonicalYoutubeChannelUrl(url) {
  try {
    const parsed = new URL(url, 'https://www.youtube.com')
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if (host !== 'youtube.com' && host !== 'm.youtube.com') {
      return ''
    }

    const match = parsed.pathname.match(/^\/(?:channel\/[^/?#]+|@[^/?#]+|c\/[^/?#]+|user\/[^/?#]+)/)
    return match ? new URL(match[0], 'https://www.youtube.com').toString().replace(/\/$/, '') : ''
  } catch {
    return ''
  }
}

function youtubeChannelInfoFromUrl(url) {
  try {
    const parsed = new URL(url, 'https://www.youtube.com')
    const path = parsed.pathname
    const channelId = path.match(/^\/channel\/([^/?#]+)/)?.[1] || ''
    const handleMatch = path.match(/^\/(?:@|c\/|user\/)([^/?#]+)/)

    return {
      channelId,
      handle: normalizeYoutubeHandle(handleMatch?.[1] || ''),
      channelUrl: canonicalYoutubeChannelUrl(parsed.toString()),
    }
  } catch {
    return { channelId: '', handle: '', channelUrl: '' }
  }
}

function mergeYoutubeChannelInfo(...infos) {
  return infos.reduce((merged, info) => ({
    channelId: merged.channelId || info?.channelId || '',
    handle: merged.handle || info?.handle || '',
    channelUrl: merged.channelUrl || info?.channelUrl || '',
  }), { channelId: '', handle: '', channelUrl: '' })
}

function isActiveYoutubeChannelInfo(info) {
  if (!info.channelId && !info.handle && !info.channelUrl) {
    return false
  }

  return youtubeChannels.some((channel) => (
    (info.channelId && channel.channelId && info.channelId === channel.channelId)
    || (info.handle && channel.handle && info.handle === channel.handle)
    || (info.channelUrl && channel.channelUrl && info.channelUrl === channel.channelUrl)
  ))
}

function isActiveYoutubeChannelUrl(url) {
  return isActiveYoutubeChannelInfo(youtubeChannelInfoFromUrl(url))
}

function isCurrentYouTubeNewsPage() {
  if (!isYouTubeVideoPage()) {
    return false
  }

  return isActiveYoutubeChannelInfo(currentYoutubeChannelInfo())
}

function currentYoutubeChannelInfo() {
  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname
  let info = { channelId: '', handle: '', channelUrl: '' }

  if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    const channelPath = path.match(/^\/(?:channel\/[^/?#]+|@[^/?#]+|c\/[^/?#]+|user\/[^/?#]+)/)?.[0]
    if (channelPath) {
      info = mergeYoutubeChannelInfo(info, youtubeChannelInfoFromUrl(new URL(channelPath, 'https://www.youtube.com').toString()))
    }

    const ownerAnchors = [...document.querySelectorAll(
      [
        'ytd-watch-metadata ytd-video-owner-renderer a[href^="/@"]',
        'ytd-watch-metadata ytd-video-owner-renderer a[href^="/channel/"]',
        'ytd-watch-metadata #owner a[href^="/@"]',
        'ytd-watch-metadata #owner a[href^="/channel/"]',
        'ytd-watch-metadata ytd-channel-name a[href^="/@"]',
        'ytd-watch-metadata ytd-channel-name a[href^="/channel/"]',
        '#owner ytd-channel-name a[href^="/@"]',
        '#owner ytd-channel-name a[href^="/channel/"]',
        '#upload-info ytd-channel-name a[href^="/@"]',
        '#upload-info ytd-channel-name a[href^="/channel/"]',
      ].join(', '),
    )]
    for (const anchor of ownerAnchors) {
      const href = anchor?.getAttribute('href')
      if (href) {
        info = mergeYoutubeChannelInfo(info, youtubeChannelInfoFromUrl(new URL(href, 'https://www.youtube.com').toString()))
      }
    }

    const itempropUrl = document.querySelector('ytd-watch-metadata link[itemprop="url"][href*="youtube.com/"], ytd-watch-metadata meta[itemprop="url"][content*="youtube.com/"]')
    const itempropHref = itempropUrl?.getAttribute('href') || itempropUrl?.getAttribute('content')
    if (itempropHref) {
      info = mergeYoutubeChannelInfo(info, youtubeChannelInfoFromUrl(itempropHref))
    }

    const channelIdMeta = document.querySelector('ytd-watch-metadata meta[itemprop="channelId"][content], meta[itemprop="channelId"][content]')
    const channelId = channelIdMeta?.getAttribute('content')
    if (channelId) {
      info = mergeYoutubeChannelInfo(info, { channelId, handle: '', channelUrl: new URL(`/channel/${channelId}`, 'https://www.youtube.com').toString() })
    }

    info = mergeYoutubeChannelInfo(info, channelInfoFromYoutubeInitialData())
  }

  return info
}

function currentYoutubeChannelUrl() {
  const info = currentYoutubeChannelInfo()
  if (info.channelUrl) return info.channelUrl
  if (info.channelId) return new URL(`/channel/${info.channelId}`, 'https://www.youtube.com').toString()
  if (info.handle) return new URL(`/@${info.handle}`, 'https://www.youtube.com').toString()

  return ''
}

function channelInfoFromYoutubeInitialData() {
  const scripts = [...document.scripts].filter((script) => script.textContent?.includes('videoOwnerRenderer'))

  for (const script of scripts) {
    const source = script.textContent || ''
    const ownerBlock = source.match(/"videoOwnerRenderer":\{[\s\S]{0,5000}?\}\s*,\s*"/)?.[0] || source
    const canonicalBaseUrl = ownerBlock.match(/"canonicalBaseUrl":"(\/@[^"]+)"/)?.[1]
    const browseId = ownerBlock.match(/"browseId":"(UC[^"]+)"/)?.[1]
    let info = { channelId: browseId || '', handle: '', channelUrl: '' }

    if (canonicalBaseUrl) {
      info = mergeYoutubeChannelInfo(info, youtubeChannelInfoFromUrl(new URL(canonicalBaseUrl.replaceAll('\\/', '/'), 'https://www.youtube.com').toString()))
    }

    if (info.channelId || info.handle || info.channelUrl) {
      return info
    }
  }

  return { channelId: '', handle: '', channelUrl: '' }
}

function isPotentialUntrackedNewsPage() {
  if (isCurrentNewsPage()) {
    return false
  }

  const path = window.location.pathname.toLowerCase()
  const articleMeta = document.querySelector('meta[property="og:type"][content*="article" i], meta[name="article:published_time"]')
  const articleElement = document.querySelector('article, main, [role="main"]')
  const hasArticleShape = articleElement && articleElement.getBoundingClientRect().height > 360

  return Boolean(articleMeta || hasArticleShape || /news|article|story|politics|world|business/.test(path))
}

function shouldSuppressHoverTooltip() {
  return Boolean(articleBanner && document.documentElement.contains(articleBanner) && articleBannerUrl === window.location.href)
}

function youtubeActionContainer() {
  if (!isYouTubeVideoPage()) {
    return null
  }

  return document.querySelector('ytd-watch-metadata #top-level-buttons-computed')
    || document.querySelector('ytd-watch-metadata #actions')
    || document.querySelector('#top-level-buttons-computed')
}

function ensureTooltipBox() {
  if (tooltipBox) {
    return tooltipBox
  }

  tooltipBox = document.createElement('div')
  tooltipBox.setAttribute('role', 'status')
  tooltipBox.style.position = 'absolute'
  tooltipBox.style.zIndex = '2147483647'
  tooltipBox.style.width = '320px'
  tooltipBox.style.border = '1px solid rgba(255, 255, 255, 0.12)'
  tooltipBox.style.borderRadius = '8px'
  tooltipBox.style.background = '#09090b'
  tooltipBox.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.42)'
  tooltipBox.style.color = '#f4f4f5'
  tooltipBox.style.font = '13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  tooltipBox.style.display = 'none'
  tooltipBox.style.overflow = 'hidden'
  tooltipBox.style.pointerEvents = 'none'
  document.body.appendChild(tooltipBox)

  return tooltipBox
}

function positionTooltip(anchor) {
  const rect = anchor.getBoundingClientRect()
  const top = window.scrollY + rect.bottom + 8
  const maxLeft = window.scrollX + document.documentElement.clientWidth - 340
  const left = Math.min(window.scrollX + rect.left, maxLeft)

  tooltipBox.style.top = `${Math.max(8, top)}px`
  tooltipBox.style.left = `${Math.max(8, left)}px`
}

function tooltipToneStyle(tone) {
  if (tone === 'danger') return { border: '#f87171', background: 'rgba(127, 29, 29, 0.94)', accent: '#fecaca' }
  if (tone === 'warning') return { border: '#fb923c', background: 'rgba(124, 45, 18, 0.94)', accent: '#fed7aa' }
  if (tone === 'positive') return { border: '#34d399', background: 'rgba(6, 78, 59, 0.94)', accent: '#bbf7d0' }

  return { border: 'rgba(103, 232, 249, 0.45)', background: '#09090b', accent: '#67e8f9' }
}

function renderTooltip(payload, loading = false, failed = false) {
  const box = ensureTooltipBox()
  const tone = tooltipToneStyle(payload?.tone)
  box.style.borderColor = tone.border
  box.style.background = tone.background

  const displayText = loading
    ? t('checkingLink')
    : failed
      ? t('tagUnavailable')
      : payload?.display_text || t('noData')

  const meta = payload?.finalized_at
    ? t('finalized')
    : isPayloadVotingClosed(payload)
      ? t('voteClosed')
      : t('tooltipHint')

  box.innerHTML = `
    <div style="padding: 12px 14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
        <strong style="color:${tone.accent};font-size:12px;">TruthShield</strong>
        <span style="color:#a1a1aa;font-size:11px;">${loading ? t('checking') : t('live')}</span>
      </div>
      <div style="font-weight:700;line-height:1.45;">${escapeHtml(displayText)}</div>
      <div style="margin-top:6px;color:#d4d4d8;font-size:12px;line-height:1.45;">${escapeHtml(meta)}</div>
    </div>
  `
}

function isPayloadVotingClosed(payload) {
  return payload?.is_open === false && Boolean(payload?.voting_closes_at || payload?.finalized_at)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function showTooltip(anchor) {
  if (shouldSuppressHoverTooltip()) {
    scheduleHideTooltip()
    return
  }

  window.clearTimeout(hideTimer)
  activeAnchor = anchor

  const box = ensureTooltipBox()
  const statusUrl = canonicalStatusUrl(anchor.href)
  const cached = getTooltipStatusCache(statusUrl)
  renderTooltip(cached?.payload || null, !cached, cached?.state === 'failed')
  box.style.display = 'block'
  positionTooltip(anchor)
  reportExtensionEvent('tooltip_shown', true, { href_host: new URL(anchor.href).hostname, mode: 'inline_dom' })

  try {
    const payload = await fetchTooltipStatus(statusUrl)
    if (activeAnchor === anchor) renderTooltip(payload)
  } catch {
    if (activeAnchor === anchor) renderTooltip(null, false, true)
  }
}

async function fetchTooltipStatus(url) {
  const cached = getTooltipStatusCache(url)
  if (cached?.state === 'success') {
    return cached.payload
  }

  if (cached?.state === 'failed') {
    throw new Error('cached tooltip status failure')
  }

  if (tooltipStatusRequests.has(url)) {
    return tooltipStatusRequests.get(url)
  }

  const request = fetchStatus(url)
    .then((payload) => {
      setTooltipStatusCache(url, { state: 'success', payload })
      return payload
    })
    .catch((error) => {
      setTooltipStatusCache(url, { state: 'failed' })
      throw error
    })
    .finally(() => {
      tooltipStatusRequests.delete(url)
    })

  tooltipStatusRequests.set(url, request)
  return request
}

function getTooltipStatusCache(url) {
  const cached = tooltipStatusCache.get(url)
  if (!cached) {
    return null
  }

  if (Date.now() - cached.cachedAt > TOOLTIP_STATUS_CACHE_TTL_MS) {
    tooltipStatusCache.delete(url)
    return null
  }

  return cached
}

function setTooltipStatusCache(url, value) {
  tooltipStatusCache.set(url, { ...value, cachedAt: Date.now() })

  if (tooltipStatusCache.size <= TOOLTIP_STATUS_CACHE_MAX) {
    return
  }

  const oldestKey = tooltipStatusCache.keys().next().value
  if (oldestKey) {
    tooltipStatusCache.delete(oldestKey)
  }
}

function canonicalStatusUrl(value) {
  try {
    const url = new URL(value, window.location.href)
    url.hash = ''

    const videoUrl = canonicalVideoStatusUrl(url)
    if (videoUrl) return videoUrl

    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase()
      if (
        normalizedKey.startsWith('utm_') ||
        ['fbclid', 'gclid', 'dclid', 'mc_cid', 'mc_eid', 'igshid', 'ref', 'ref_src', 'spm'].includes(normalizedKey)
      ) {
        url.searchParams.delete(key)
      }
    }

    const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
    url.search = ''
    for (const [key, itemValue] of sortedParams) {
      url.searchParams.append(key, itemValue)
    }

    return url.toString()
  } catch {
    return value
  }
}

function canonicalVideoStatusUrl(url) {
  const host = url.hostname.toLowerCase()
  const path = url.pathname
  let videoId = ''

  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    if (path === '/watch') {
      videoId = url.searchParams.get('v') || ''
    } else {
      const match = path.match(/^\/(?:shorts|live|embed)\/([^/?]+)/)
      videoId = match?.[1] || ''
    }
  }

  if (host === 'youtu.be') {
    videoId = path.split('/').filter(Boolean)[0] || ''
  }

  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : ''
}

async function fetchStatus(url) {
  if (chrome.runtime?.sendMessage) {
    const response = await chrome.runtime.sendMessage({ type: 'TRUTH_SHIELD_FETCH_STATUS', url })
    if (!response?.ok) throw new Error(response?.message || `status ${response?.status || 0}`)
    return response.payload
  }

  const response = await fetch(`${API_ORIGIN}/api/news/status?url=${encodeURIComponent(url)}`, {
    headers: extensionRequestHeaders({ Accept: 'application/json' }),
  })

  if (!response.ok) throw new Error(`status ${response.status}`)
  return response.json()
}

function ensureArticleBanner() {
  debugLog('ensureArticleBanner:start', { dismissed: articleBannerDismissed, href: window.location.href })
  if (articleBannerDismissed) {
    return null
  }

  if (articleBanner && document.documentElement.contains(articleBanner) && articleBannerUrl === window.location.href) {
    const container = youtubeActionContainer()
    if (!isYouTubeVideoPage() || !container || container.contains(articleBanner)) {
      return articleBanner
    }

    removeArticleBanner()
  }

  removeArticleBanner()

  articleBanner = document.createElement('div')
  articleBannerUrl = window.location.href
  const youtubeMode = isYouTubeVideoPage()
  const youtubeContainer = youtubeMode ? youtubeActionContainer() : null
  articleBanner.dataset.truthshieldMode = youtubeMode ? 'youtube_chip' : 'article_bar'
  articleBanner.setAttribute('role', 'region')
  articleBanner.setAttribute('aria-label', t('newsStatus'))
  articleBanner.style.position = youtubeContainer ? 'relative' : 'sticky'
  articleBanner.style.top = youtubeMode ? (youtubeContainer ? 'auto' : '72px') : '0'
  articleBanner.style.left = youtubeMode ? 'auto' : '0'
  articleBanner.style.right = youtubeMode ? '16px' : '0'
  articleBanner.style.zIndex = '2147483646'
  articleBanner.style.boxSizing = 'border-box'
  articleBanner.style.padding = youtubeMode ? '6px 8px' : '8px 14px'
  articleBanner.style.border = youtubeMode ? '1px solid rgba(255, 255, 255, 0.16)' : '0'
  articleBanner.style.borderBottom = '1px solid rgba(255, 255, 255, 0.16)'
  articleBanner.style.borderRadius = youtubeMode ? '999px' : '0'
  articleBanner.style.background = 'rgba(9, 9, 11, 0.96)'
  articleBanner.style.color = '#f4f4f5'
  articleBanner.style.boxShadow = youtubeMode ? '0 10px 30px rgba(0, 0, 0, 0.34)' : '0 18px 48px rgba(0, 0, 0, 0.34)'
  articleBanner.style.font = '13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  articleBanner.style.colorScheme = 'normal'
  articleBanner.style.backdropFilter = 'blur(12px)'
  articleBanner.style.cursor = 'pointer'
  articleBanner.style.maxWidth = youtubeMode ? 'min(360px, calc(100vw - 32px))' : 'none'
  articleBanner.style.marginRight = youtubeContainer ? '8px' : '0'
  articleBanner.style.width = youtubeMode ? 'auto' : '100%'
  articleBanner.addEventListener('click', (event) => {
    const target = event.target
    if (target?.closest?.('[data-truthshield-close-banner]')) {
      event.preventDefault()
      event.stopPropagation()
      dismissArticleBanner()
      return
    }

    if (target?.closest?.('[data-truthshield-brand-link]')) {
      event.stopPropagation()
      return
    }

    ensureVotePanelFrame()
  })

  if (youtubeContainer) {
    youtubeContainer.prepend(articleBanner)
  } else {
    ;(document.body || document.documentElement).prepend(articleBanner)
  }
  debugLog('ensureArticleBanner:inserted', { mode: articleBanner.dataset.truthshieldMode, inDom: document.documentElement.contains(articleBanner) })
  renderArticleBannerFromCache(window.location.href)

  if (!articleBannerReportedUrls.has(window.location.href)) {
    articleBannerReportedUrls.add(window.location.href)
    reportExtensionEvent('article_banner_injected', true, { mode: youtubeMode ? (youtubeContainer ? 'youtube_action_chip' : 'youtube_floating_chip') : 'fixed_top' })
  }

  loadArticleBannerStatusOnce(window.location.href)

  return articleBanner
}

function removeArticleBanner() {
  if (articleBanner?.parentNode) {
    articleBanner.remove()
  }

  articleBanner = null
  articleBannerUrl = ''
}

function dismissArticleBanner() {
  articleBannerDismissed = true
  removeArticleBanner()
}

function renderArticleBanner(payload, loading = false, failed = false) {
  if (!articleBanner) {
    return
  }

  const tone = tooltipToneStyle(payload?.tone)
  articleBanner.style.borderColor = articleBanner.dataset.truthshieldMode === 'youtube_chip' ? tone.border : 'transparent'
  articleBanner.style.borderBottomColor = tone.border

  const displayText = loading
    ? t('checkingNews')
    : failed
      ? t('ratingUnavailable')
      : payload?.display_text || t('noData')

  const statusText = payload?.finalized_at
    ? t('resultFinalized')
    : isPayloadVotingClosed(payload)
      ? t('voteClosed')
      : t('readEvidence')

  if (articleBanner.dataset.truthshieldMode === 'youtube_chip') {
    articleBanner.innerHTML = `
      <div style="display:flex;align-items:center;gap:7px;min-width:0;">
        <a data-truthshield-brand-link href="${escapeHtml(TOOLTIP_ORIGIN)}/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:5px;color:${tone.accent};text-decoration:none;white-space:nowrap;">
          <img src="${escapeHtml(TOOLTIP_ORIGIN)}/brand/truthshield-mark.svg" alt="" style="width:18px;height:18px;display:block;" />
          <strong style="font-size:12px;letter-spacing:0;">TruthShield</strong>
        </a>
        <span style="max-width:178px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:750;line-height:1.2;">${escapeHtml(displayText)}</span>
        <span style="border:1px solid ${tone.border};border-radius:999px;color:${tone.accent};background:rgba(255,255,255,.04);padding:3px 7px;font:700 11px system-ui;white-space:nowrap;">${t('open')}</span>
        <button data-truthshield-close-banner type="button" aria-label="${t('closeBanner')}" style="border:0;background:transparent;color:#a1a1aa;padding:2px 3px;font:800 13px system-ui;cursor:pointer;">×</button>
      </div>
    `
    articleBanner.title = `${displayText} · ${statusText}`
    return
  }

  articleBanner.innerHTML = `
    <div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:10px;max-width:1180px;margin:0 auto;">
      <a data-truthshield-brand-link href="${escapeHtml(TOOLTIP_ORIGIN)}/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;color:${tone.accent};text-decoration:none;white-space:nowrap;">
        <img src="${escapeHtml(TOOLTIP_ORIGIN)}/brand/truthshield-mark.svg" alt="" style="width:22px;height:22px;display:block;" />
        <strong style="font-size:12px;letter-spacing:0;">TruthShield</strong>
      </a>
      <div style="min-width:0;">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:750;line-height:1.35;">${escapeHtml(displayText)}</div>
        <div style="margin-top:1px;color:#a1a1aa;font-size:11px;line-height:1.25;">${escapeHtml(statusText)}</div>
      </div>
      <span style="border:1px solid ${tone.border};border-radius:6px;color:${tone.accent};background:rgba(255,255,255,.04);padding:5px 8px;font:700 12px system-ui;white-space:nowrap;">${t('open')}</span>
      <button data-truthshield-close-banner type="button" aria-label="${t('closeBanner')}" style="border:1px solid rgba(255,255,255,.16);border-radius:6px;background:rgba(255,255,255,.04);color:#d4d4d8;padding:6px 9px;font:700 12px system-ui;cursor:pointer;">×</button>
    </div>
  `
}

function renderArticleBannerFromCache(url) {
  const cacheKey = canonicalStatusUrl(url)
  const cached = articleBannerStatusCache.get(cacheKey)

  if (cached?.state === 'success') {
    renderArticleBanner(cached.payload)
    return
  }

  if (cached?.state === 'failed') {
    renderArticleBanner(null, false, true)
    return
  }

  renderArticleBanner(null, true)
}

function loadArticleBannerStatusOnce(url) {
  const cacheKey = canonicalStatusUrl(url)

  if (articleBannerStatusCache.has(cacheKey) || articleBannerStatusRequests.has(cacheKey)) {
    return
  }

  const request = fetchStatus(cacheKey)
    .then((payload) => {
      articleBannerStatusCache.set(cacheKey, { state: 'success', payload })
      if (articleBannerUrl === url) renderArticleBanner(payload)
    })
    .catch(() => {
      articleBannerStatusCache.set(cacheKey, { state: 'failed' })
      if (articleBannerUrl === url) renderArticleBanner(null, false, true)
    })
    .finally(() => {
      articleBannerStatusRequests.delete(cacheKey)
    })

  articleBannerStatusRequests.set(cacheKey, request)
}

function clearStatusCachesForUrl(url) {
  const cacheKey = canonicalStatusUrl(url || window.location.href)
  tooltipStatusCache.delete(cacheKey)
  tooltipStatusRequests.delete(cacheKey)
  articleBannerStatusCache.delete(cacheKey)
  articleBannerStatusRequests.delete(cacheKey)
}

async function refreshArticleBannerStatus(url = window.location.href, knownStatus = null) {
  const cacheKey = canonicalStatusUrl(url)

  if (knownStatus) {
    articleBannerStatusCache.set(cacheKey, { state: 'success', payload: knownStatus })
    if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
      renderArticleBanner(knownStatus)
    }
    return
  }

  clearStatusCachesForUrl(cacheKey)
  if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
    renderArticleBanner(null, true)
  }

  try {
    const payload = await fetchStatus(cacheKey)
    articleBannerStatusCache.set(cacheKey, { state: 'success', payload })
    if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
      renderArticleBanner(payload)
    }
  } catch {
    articleBannerStatusCache.set(cacheKey, { state: 'failed' })
    if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
      renderArticleBanner(null, false, true)
    }
  }
}

function ensureVotePanelFrame(url = window.location.href) {
  return openVotePanelModal(url)
}

async function loadVotePanelPosition() {
  try {
    const stored = await chrome.storage?.local?.get?.(VOTE_PANEL_POSITION_KEY)
    const value = stored?.[VOTE_PANEL_POSITION_KEY]
    if (!value || typeof value.left !== 'number' || typeof value.top !== 'number') return null

    return {
      left: value.left,
      top: value.top,
    }
  } catch {
    return null
  }
}

function saveVotePanelPosition() {
  if (!votePanelPosition || !chrome.storage?.local?.set) return

  chrome.storage.local.set({
    [VOTE_PANEL_POSITION_KEY]: {
      left: Math.round(votePanelPosition.left),
      top: Math.round(votePanelPosition.top),
      savedAt: Date.now(),
    },
  }).catch?.(() => null)
}

function clampVotePanelPosition(left, top, width = votePanelShell?.offsetWidth || 420, height = votePanelShell?.offsetHeight || 620) {
  const margin = 8
  const maxLeft = Math.max(margin, window.innerWidth - width - margin)
  const maxTop = Math.max(margin, window.innerHeight - height - margin)

  return {
    left: Math.max(margin, Math.min(left, maxLeft)),
    top: Math.max(margin, Math.min(top, maxTop)),
  }
}

function applyVotePanelPosition(position = votePanelPosition) {
  if (!votePanelBackdrop || !votePanelShell) return

  const shellWidth = votePanelCollapsed ? Math.min(240, window.innerWidth - 16) : Math.min(420, window.innerWidth - 32)
  const shellHeight = votePanelShell.offsetHeight || (votePanelCollapsed ? 56 : 620)
  const fallback = {
    left: window.innerWidth - shellWidth - 16,
    top: 72,
  }
  const next = clampVotePanelPosition(position?.left ?? fallback.left, position?.top ?? fallback.top, shellWidth, shellHeight)

  votePanelPosition = next
  votePanelBackdrop.style.left = `${next.left}px`
  votePanelBackdrop.style.top = `${next.top}px`
  votePanelBackdrop.style.right = 'auto'
  votePanelBackdrop.style.bottom = 'auto'
  votePanelBackdrop.style.width = `${shellWidth}px`
  votePanelBackdrop.style.height = 'auto'
}

function updateVotePanelShellSize(height, collapsed = votePanelCollapsed) {
  if (!votePanelFrame || !votePanelShell) return

  votePanelCollapsed = Boolean(collapsed)
  const maxExpandedHeight = Math.max(300, Math.min(window.innerHeight - 88, 760))
  const nextHeight = votePanelCollapsed ? Math.max(48, Math.min(Number(height) || 56, 96)) : Math.max(300, Math.min(Number(height) || 620, maxExpandedHeight))
  const nextWidth = votePanelCollapsed ? 'min(240px, calc(100vw - 16px))' : 'min(420px, calc(100vw - 32px))'

  votePanelFrame.style.height = `${nextHeight}px`
  votePanelFrame.style.maxHeight = votePanelCollapsed ? '96px' : 'calc(100vh - 88px)'
  votePanelShell.style.width = nextWidth
  votePanelShell.style.maxHeight = votePanelCollapsed ? '96px' : 'calc(100vh - 88px)'

  applyVotePanelPosition()
}

function startVotePanelDrag(event) {
  if (!votePanelBackdrop || !votePanelShell || event.button !== 0) return

  const target = event.target
  if (target?.closest?.('button, a, input, textarea, select, label')) return

  const rect = votePanelBackdrop.getBoundingClientRect()
  votePanelDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
  }

  votePanelShell.setPointerCapture?.(event.pointerId)
  votePanelShell.style.cursor = 'grabbing'
  votePanelShell.style.userSelect = 'none'
  votePanelFrame.style.pointerEvents = 'none'
  event.preventDefault()
}

function moveVotePanelDrag(event) {
  if (!votePanelDrag || event.pointerId !== votePanelDrag.pointerId) return

  const next = clampVotePanelPosition(
    event.clientX - votePanelDrag.offsetX,
    event.clientY - votePanelDrag.offsetY,
    votePanelDrag.width,
    votePanelDrag.height,
  )
  applyVotePanelPosition(next)
  event.preventDefault()
}

function stopVotePanelDrag(event) {
  if (!votePanelDrag || event.pointerId !== votePanelDrag.pointerId) return

  votePanelShell?.releasePointerCapture?.(event.pointerId)
  votePanelShell.style.cursor = 'grab'
  votePanelShell.style.userSelect = ''
  if (votePanelFrame) votePanelFrame.style.pointerEvents = 'auto'
  votePanelDrag = null
  saveVotePanelPosition()
}

function openVotePanelModal(targetUrl = window.location.href) {
  if (votePanelBackdrop && document.body.contains(votePanelBackdrop) && votePanelUrl === targetUrl) {
    return votePanelFrame
  }

  closeVotePanelModal()

  votePanelUrl = targetUrl
  votePanelBackdrop = document.createElement('div')
  votePanelBackdrop.style.position = 'fixed'
  votePanelBackdrop.style.top = '72px'
  votePanelBackdrop.style.right = 'auto'
  votePanelBackdrop.style.bottom = 'auto'
  votePanelBackdrop.style.left = 'auto'
  votePanelBackdrop.style.zIndex = '2147483647'
  votePanelBackdrop.style.background = 'transparent'
  votePanelBackdrop.style.display = 'block'
  votePanelBackdrop.style.padding = '0'
  votePanelBackdrop.style.boxSizing = 'border-box'
  votePanelBackdrop.style.colorScheme = 'normal'
  votePanelBackdrop.style.pointerEvents = 'none'

  const shell = document.createElement('div')
  votePanelShell = shell
  shell.style.position = 'relative'
  shell.style.width = 'min(420px, calc(100vw - 32px))'
  shell.style.maxHeight = 'calc(100vh - 88px)'
  shell.style.border = '1px solid rgba(255, 255, 255, 0.14)'
  shell.style.borderRadius = '10px'
  shell.style.background = '#09090b'
  shell.style.boxShadow = '0 28px 80px rgba(0, 0, 0, 0.48)'
  shell.style.overflow = 'hidden'
  shell.style.pointerEvents = 'auto'
  shell.style.cursor = 'grab'
  shell.style.touchAction = 'none'
  shell.style.transition = 'width 160ms ease, max-height 160ms ease'
  shell.addEventListener('pointerdown', startVotePanelDrag)
  shell.addEventListener('pointermove', moveVotePanelDrag)
  shell.addEventListener('pointerup', stopVotePanelDrag)
  shell.addEventListener('pointercancel', stopVotePanelDrag)

  const dragHandle = document.createElement('div')
  dragHandle.setAttribute('aria-hidden', 'true')
  dragHandle.style.position = 'absolute'
  dragHandle.style.top = '6px'
  dragHandle.style.left = '50%'
  dragHandle.style.transform = 'translateX(-50%)'
  dragHandle.style.zIndex = '2'
  dragHandle.style.width = '42px'
  dragHandle.style.height = '16px'
  dragHandle.style.borderRadius = '999px'
  dragHandle.style.background = 'rgba(255, 255, 255, 0.08)'
  dragHandle.style.boxShadow = 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
  dragHandle.style.cursor = 'grab'
  dragHandle.style.pointerEvents = 'auto'
  dragHandle.innerHTML = '<span style="display:block;width:18px;height:3px;margin:6px auto 0;border-radius:999px;background:rgba(103,232,249,.72);"></span>'

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.textContent = '×'
  closeButton.setAttribute('aria-label', t('closePanel'))
  closeButton.style.position = 'absolute'
  closeButton.style.top = '8px'
  closeButton.style.right = '8px'
  closeButton.style.zIndex = '1'
  closeButton.style.border = '1px solid rgba(255,255,255,.14)'
  closeButton.style.borderRadius = '6px'
  closeButton.style.background = 'rgba(9,9,11,.92)'
  closeButton.style.color = '#f4f4f5'
  closeButton.style.width = '28px'
  closeButton.style.height = '28px'
  closeButton.style.cursor = 'pointer'
  closeButton.addEventListener('click', closeVotePanelModal)

  votePanelFrame = document.createElement('iframe')
  votePanelFrame.title = t('votePanelTitle')
  votePanelFrame.style.width = '100%'
  votePanelFrame.style.height = '620px'
  votePanelFrame.style.maxHeight = 'calc(100vh - 88px)'
  votePanelFrame.style.border = '0'
  votePanelFrame.style.background = 'transparent'
  votePanelFrame.style.display = 'block'
  votePanelFrame.style.colorScheme = 'normal'
  votePanelFrame.addEventListener('load', postStoredAuthToVotePanelFrame)

  const panelUrl = new URL('/iframe-vote-panel', TOOLTIP_ORIGIN)
  panelUrl.searchParams.set('news_url', targetUrl)
  panelUrl.searchParams.set('expanded', '1')
  panelUrl.searchParams.set('locale', contentLocale)
  if (targetUrl === window.location.href) {
    panelUrl.searchParams.set('title_snapshot', document.title || '')
    const canonical = document.querySelector('link[rel="canonical"]')?.href || ''
    if (canonical) panelUrl.searchParams.set('canonical_url', canonical)
    const description = document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || ''
    if (description) panelUrl.searchParams.set('description', description.slice(0, 500))
    const imageUrl = document.querySelector('meta[property="og:image"]')?.content || ''
    if (imageUrl) panelUrl.searchParams.set('image_url', imageUrl)
  }
  votePanelFrame.src = panelUrl.toString()

  shell.append(dragHandle, closeButton, votePanelFrame)
  votePanelBackdrop.appendChild(shell)
  document.documentElement.appendChild(votePanelBackdrop)
  loadVotePanelPosition().then((position) => {
    if (votePanelBackdrop && votePanelShell && votePanelUrl === targetUrl) {
      applyVotePanelPosition(position)
    }
  })
  updateVotePanelShellSize(620, false)
  postStoredAuthToVotePanelFrame()
  reportExtensionEvent('vote_panel_opened', true, { mode: 'side_panel_from_banner' })
  startArticleReadTimer()

  return votePanelFrame
}

function closeVotePanelModal() {
  if (votePanelBackdrop?.parentNode) {
    votePanelBackdrop.remove()
  }

  votePanelBackdrop = null
  votePanelFrame = null
  votePanelShell = null
  votePanelUrl = ''
  votePanelCollapsed = false
  votePanelDrag = null
}

function maybeInjectVotePanel() {
  const tracked = isCurrentNewsPage()
  const likely = tracked ? isLikelyArticlePage() : false
  debugLog('maybeInjectVotePanel', {
    enablePanel,
    href: window.location.href,
    tracked,
    likely,
    domainCount: newsDomains.length,
    domainMatched: newsDomains.find((domain) => window.location.hostname === domain || window.location.hostname.endsWith(`.${domain}`)) || '',
  })
  if (!tracked || !likely) {
    if (tracked && !articleBannerSkippedUrls.has(window.location.href)) {
      articleBannerSkippedUrls.add(window.location.href)
      reportExtensionEvent('article_banner_skipped', false, { reason: 'not_article_shape' })
    }
    return
  }

  if (isYouTubeVideoPage() && articleBanner && articleBanner.dataset.truthshieldMode === 'youtube_chip' && !document.documentElement.contains(articleBanner)) {
    removeArticleBanner()
  }

  if (ensureArticleBanner()) {
    startArticleReadTimer()
  }
}

function startArticleReadTimer() {
  if (articleReadTimer) {
    return
  }

  articleReadTimer = window.setInterval(() => {
    if (document.hidden || !isCurrentNewsPage() || !isLikelyArticlePage()) {
      return
    }

    articleReadSeconds += 1

    if (votePanelFrame?.contentWindow && articleReadSeconds % 5 === 0) {
      votePanelFrame.contentWindow.postMessage(
        {
          type: 'TRUTH_SHIELD_ARTICLE_READ_TICK',
          secondsRead: articleReadSeconds,
          pageTitle: document.title || '',
        },
        tooltipOrigin(),
      )
    }
  }, 1000)
}

function stopArticleReadTimer() {
  if (!articleReadTimer) {
    return
  }

  window.clearInterval(articleReadTimer)
  articleReadTimer = null
}

function schedulePageInjection() {
  window.clearTimeout(schedulePageInjection.timer)
  schedulePageInjection.timer = window.setTimeout(() => {
    if (enablePanel) maybeInjectVotePanel()
    maybeInjectDomainReportButton()
  }, 350)
}

function observeArticleChanges() {
  let currentHref = window.location.href
  const handleUrlChange = () => {
    if (currentHref === window.location.href) {
      return
    }

    currentHref = window.location.href
    closeVotePanelModal()
    removeArticleBanner()
    votePanelUrl = ''
    articleReadSeconds = 0
    stopArticleReadTimer()
    schedulePageInjection()
  }

  const observer = new MutationObserver(() => {
    handleUrlChange()
    schedulePageInjection()
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('popstate', handleUrlChange)
  window.addEventListener('yt-navigate-finish', handleUrlChange)
}

function ensureReportButton() {
  if (reportButton) {
    return reportButton
  }

  reportButton = document.createElement('button')
  reportButton.type = 'button'
  reportButton.textContent = t('reportMissing')
  reportButton.style.position = 'fixed'
  reportButton.style.right = '16px'
  reportButton.style.bottom = '16px'
  reportButton.style.zIndex = '2147483645'
  reportButton.style.border = '1px solid rgba(103, 232, 249, 0.45)'
  reportButton.style.borderRadius = '999px'
  reportButton.style.background = 'rgba(9, 9, 11, 0.94)'
  reportButton.style.color = '#cffafe'
  reportButton.style.padding = '10px 14px'
  reportButton.style.font = '600 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  reportButton.style.boxShadow = '0 18px 44px rgba(0, 0, 0, 0.35)'
  reportButton.style.cursor = 'pointer'
  reportButton.addEventListener('click', () => {
    const reportUrl = new URL('/report-domain', TOOLTIP_ORIGIN)
    reportUrl.searchParams.set('url', window.location.href)
    reportUrl.searchParams.set('page_title', document.title || '')
    reportUrl.searchParams.set('locale', contentLocale)
    const youtubeChannelUrl = currentYoutubeChannelUrl()
    if (youtubeChannelUrl) {
      reportUrl.searchParams.set('youtube_channel_url', youtubeChannelUrl)
    }
    window.open(reportUrl.toString(), 'truthshield-report-domain', 'width=520,height=720')
  })
  document.body.appendChild(reportButton)

  return reportButton
}

function maybeInjectDomainReportButton() {
  if (!enableReportButton || !isPotentialUntrackedNewsPage()) {
    return
  }

  ensureReportButton()
}

function scheduleTooltip(anchor) {
  if (shouldSuppressHoverTooltip()) {
    scheduleHideTooltip()
    return
  }

  window.clearTimeout(hoverTimer)
  hoverTimer = window.setTimeout(() => {
    if (!shouldSuppressHoverTooltip() && (activeAnchor === anchor || document.body.contains(anchor))) {
      showTooltip(anchor)
    }
  }, HOVER_DELAY_MS)
}

function scheduleHideTooltip() {
  window.clearTimeout(hoverTimer)
  hideTimer = window.setTimeout(() => {
    if (tooltipBox) {
      tooltipBox.style.display = 'none'
    }
    activeAnchor = null
  }, 80)
}

document.addEventListener(
  'mouseover',
  (event) => {
    const anchor = event.target.closest?.('a[href]')
    if (!enableTooltip || shouldSuppressHoverTooltip() || !anchor || !isNewsLink(anchor)) {
      return
    }

    activeAnchor = anchor
    scheduleTooltip(anchor)
  },
  true,
)

document.addEventListener(
  'mouseout',
  (event) => {
    const anchor = event.target.closest?.('a[href]')
    if (anchor && anchor === activeAnchor) {
      scheduleHideTooltip()
    }
  },
  true,
)

window.addEventListener('scroll', () => {
  if (tooltipBox?.style.display === 'block' && activeAnchor) {
    positionTooltip(activeAnchor)
  }
})

window.addEventListener('pagehide', flushExtensionTelemetry)
window.addEventListener('storage', (event) => {
  if (event.key === AUTH_TOKEN_KEY || event.key === AUTH_USER_KEY) {
    syncWebAuthToExtensionStorage()
  }
})

window.addEventListener('message', (event) => {
  if (!sameOrigin(event.origin, TOOLTIP_ORIGIN)) {
    return
  }

  if (isTruthShieldWebOrigin() && event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED' && event.data.token) {
    sendRuntimeMessage({
      type: 'TRUTH_SHIELD_SET_AUTH',
      auth: {
        token: event.data.token,
        user: event.data.user || null,
        updatedAt: Date.now(),
      },
    })
  }

  if (isTruthShieldWebOrigin() && event.data?.type === 'TRUTH_SHIELD_AUTH_CLEARED') {
    sendRuntimeMessage({ type: 'TRUTH_SHIELD_CLEAR_AUTH' })
  }

  if (event.data?.type === 'TRUTH_SHIELD_VOTE_PANEL_RESIZE' && votePanelFrame) {
    updateVotePanelShellSize(Number(event.data.height), Boolean(event.data.collapsed))
  }

  if (event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED' && event.data.token) {
    sendRuntimeMessage({
      type: 'TRUTH_SHIELD_SET_AUTH',
      auth: {
        token: event.data.token,
        user: event.data.user || null,
        updatedAt: Date.now(),
      },
    })
  }

  if (event.data?.type === 'TRUTH_SHIELD_VOTE_UPDATED') {
    refreshArticleBannerStatus(event.data.url || votePanelUrl || window.location.href, event.data.status || null)
  }
})

window.addEventListener('resize', () => {
  if (votePanelBackdrop && votePanelShell) {
    updateVotePanelShellSize(votePanelFrame?.offsetHeight || 620, votePanelCollapsed)
  }
})

chrome.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'TRUTH_SHIELD_SHOW_VOTE_PANEL') {
    ensureVotePanelFrame(message.url || window.location.href)
    startArticleReadTimer()
    sendResponse({ ok: true })
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_GET_PAGE_CONTEXT') {
    sendResponse({
      ok: true,
      url: window.location.href,
      title: document.title || '',
      isTrackedNews: isCurrentNewsPage(),
      isLikelyArticle: isLikelyArticlePage(),
      enablePanel,
      enableTooltip,
      hostname: window.location.hostname,
      matchedDomain: newsDomains.find((domain) => window.location.hostname === domain || window.location.hostname.endsWith(`.${domain}`)) || '',
      domainCount: newsDomains.length,
      hasArticleBanner: Boolean(articleBanner && document.documentElement.contains(articleBanner)),
      articleBannerDismissed,
      articleBannerUrl,
      youtubeChannelUrl: currentYoutubeChannelUrl(),
    })
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_SYNC_WEB_AUTH') {
    requestPageAuthState()
    syncWebAuthToExtensionStorage()
      .then(() => storedExtensionAuth())
      .then((auth) => sendResponse({ ok: true, auth }))
      .catch(() => sendResponse({ ok: false }))
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_EXTENSION_LOGOUT') {
    sendRuntimeMessage({ type: 'TRUTH_SHIELD_CLEAR_AUTH' })
    if (isTruthShieldWebOrigin()) {
      clearWebAuthState()
    }
    votePanelFrame?.contentWindow?.postMessage({ type: 'TRUTH_SHIELD_AUTH_CLEARED' }, tooltipOrigin())
    sendResponse({ ok: true })
    return true
  }

  return false
})

loadSettings().then(loadExtensionNonce).then(async () => {
  await Promise.all([loadNewsDomains(), loadYoutubeChannels()])
}).finally(async () => {
  installPageAuthBridge()
  requestPageAuthState()
  await syncWebAuthToExtensionStorage()
  if (enablePanel) maybeInjectVotePanel()
  maybeInjectDomainReportButton()
  observeArticleChanges()
})
