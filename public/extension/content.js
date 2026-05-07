let TOOLTIP_ORIGIN = 'http://127.0.0.1:15173'
let API_ORIGIN = 'http://127.0.0.1:18080'
const HOVER_DELAY_MS = 300
const TOOLTIP_STATUS_CACHE_TTL_MS = 5 * 60 * 1000
const TOOLTIP_STATUS_CACHE_MAX = 250
const TELEMETRY_CACHE_TTL_MS = 5 * 60 * 1000
const TELEMETRY_CACHE_MAX = 300
const TELEMETRY_BATCH_MAX = 20
const TELEMETRY_FLUSH_DELAY_MS = 5000
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
  'www.ettoday.net',
  'www.setn.com',
  'news.ltn.com.tw',
  'tw.news.yahoo.com',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
]

let newsDomains = [...FALLBACK_NEWS_DOMAINS]
let domainConfigs = []
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
let votePanelUrl = ''
let reportButton = null
let activeAnchor = null
let hideTimer = null
let hoverTimer = null
let articleReadSeconds = 0
let articleReadTimer = null
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
  const requestHeaders = { ...headers }
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
  try {
    const response = await fetch(`${API_ORIGIN}/api/news-domains`, {
      headers: extensionRequestHeaders({ Accept: 'application/json' }),
    })

    if (!response.ok) {
      return
    }

    const payload = await response.json()
    const domains = Array.isArray(payload.data)
      ? payload.data.map((item) => item.domain).filter(Boolean)
      : []

    if (domains.length > 0) {
      newsDomains = domains
      domainConfigs = payload.data
    }
  } catch {
    newsDomains = [...FALLBACK_NEWS_DOMAINS]
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
    return isNewsHostname(url.hostname)
  } catch {
    return false
  }
}

function isNewsHostname(hostname) {
  return newsDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
}

function isCurrentNewsPage() {
  return isNewsHostname(window.location.hostname)
}

function isLikelyArticlePage() {
  if (isYouTubeVideoPage()) {
    return true
  }

  if (isLocalTruthShieldDemoPage()) {
    return true
  }

  const matchedConfig = domainConfigs.find((config) => window.location.hostname === config.domain || window.location.hostname.endsWith(`.${config.domain}`))
  if (matchedConfig?.blocked_path_pattern) {
    try {
      if (new RegExp(matchedConfig.blocked_path_pattern).test(window.location.pathname)) {
        return false
      }
    } catch {
      // Invalid admin-provided patterns are ignored client-side.
    }
  }

  if (matchedConfig?.list_url_pattern) {
    try {
      if (new RegExp(matchedConfig.list_url_pattern).test(window.location.pathname)) {
        return false
      }
    } catch {
      // Invalid admin-provided patterns are ignored client-side.
    }
  }

  if (matchedConfig?.article_url_pattern) {
    try {
      if (new RegExp(matchedConfig.article_url_pattern).test(window.location.pathname)) {
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
    return false
  }

  return pathParts.length >= 2 || path.includes('news')
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

function currentYoutubeChannelUrl() {
  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname

  if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    const channelPath = path.match(/^\/(?:channel\/[^/?#]+|@[^/?#]+|c\/[^/?#]+|user\/[^/?#]+)/)?.[0]
    if (channelPath) {
      return new URL(channelPath, 'https://www.youtube.com').toString()
    }

    const ownerAnchor = document.querySelector(
      'ytd-video-owner-renderer a[href^="/@"], ytd-video-owner-renderer a[href^="/channel/"], #owner a[href^="/@"], #owner a[href^="/channel/"], a.yt-simple-endpoint[href^="/@"], a.yt-simple-endpoint[href^="/channel/"]',
    )
    const href = ownerAnchor?.getAttribute('href')
    if (href) {
      return new URL(href, 'https://www.youtube.com').toString()
    }
  }

  return ''
}

function isLocalTruthShieldDemoPage() {
  return (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') &&
    window.location.pathname.includes('/local-news-demo')
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
  articleBanner.style.position = youtubeContainer ? 'relative' : 'fixed'
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
    document.documentElement.appendChild(articleBanner)
  }
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

function ensureVotePanelFrame(url = window.location.href) {
  return openVotePanelModal(url)
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
  votePanelBackdrop.style.right = '16px'
  votePanelBackdrop.style.bottom = '16px'
  votePanelBackdrop.style.left = 'auto'
  votePanelBackdrop.style.zIndex = '2147483647'
  votePanelBackdrop.style.background = 'transparent'
  votePanelBackdrop.style.display = 'flex'
  votePanelBackdrop.style.alignItems = 'flex-start'
  votePanelBackdrop.style.justifyContent = 'flex-end'
  votePanelBackdrop.style.padding = '0'
  votePanelBackdrop.style.boxSizing = 'border-box'
  votePanelBackdrop.style.colorScheme = 'normal'
  votePanelBackdrop.style.pointerEvents = 'none'

  const shell = document.createElement('div')
  shell.style.position = 'relative'
  shell.style.width = 'min(420px, calc(100vw - 32px))'
  shell.style.maxHeight = 'calc(100vh - 88px)'
  shell.style.border = '1px solid rgba(255, 255, 255, 0.14)'
  shell.style.borderRadius = '10px'
  shell.style.background = '#09090b'
  shell.style.boxShadow = '0 28px 80px rgba(0, 0, 0, 0.48)'
  shell.style.overflow = 'hidden'
  shell.style.pointerEvents = 'auto'

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

  shell.append(closeButton, votePanelFrame)
  votePanelBackdrop.appendChild(shell)
  document.documentElement.appendChild(votePanelBackdrop)
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
  votePanelUrl = ''
}

function maybeInjectVotePanel() {
  if (!isCurrentNewsPage() || !isLikelyArticlePage()) {
    if (isCurrentNewsPage() && !articleBannerSkippedUrls.has(window.location.href)) {
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
        TOOLTIP_ORIGIN,
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

window.addEventListener('message', (event) => {
  if (event.origin !== TOOLTIP_ORIGIN) {
    return
  }

  if (event.data?.type === 'TRUTH_SHIELD_VOTE_PANEL_RESIZE' && votePanelFrame) {
    const height = Number(event.data.height)
    votePanelFrame.style.height = `${Math.max(300, Math.min(height, window.innerHeight - 88, 760))}px`
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
      youtubeChannelUrl: currentYoutubeChannelUrl(),
    })
    return true
  }

  return false
})

loadSettings().then(loadExtensionNonce).then(loadNewsDomains).finally(() => {
  if (enablePanel) maybeInjectVotePanel()
  maybeInjectDomainReportButton()
  observeArticleChanges()
})
