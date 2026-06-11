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
const ONBOARDING_STORAGE_KEY = 'truthshield_onboarding_state_v1'
const JOURNALIST_CACHE_STORAGE_KEY = 'truthshield_journalist_cache_v1'
const JOURNALIST_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const BANNER_REACTION_KEYS = ['confused', 'worried', 'absurd', 'angry', 'sad', 'happy', 'indifferent', 'clear', 'credible']
const FALLBACK_REACTION_FEELINGS = [
  { key: 'confused', emoji: '😕', label: '資訊混亂' },
  { key: 'worried', emoji: '😟', label: '擔心' },
  { key: 'absurd', emoji: '🙄', label: '很瞎' },
  { key: 'angry', emoji: '😠', label: '憤怒' },
  { key: 'sad', emoji: '😔', label: '難過' },
  { key: 'happy', emoji: '😊', label: '看了開心' },
  { key: 'indifferent', emoji: '😐', label: '無所謂' },
  { key: 'clear', emoji: '🙂', label: '覺得清楚' },
  { key: 'credible', emoji: '✅', label: '覺得可信' },
]
let enableTooltip = true
let enablePanel = true
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
  'art.ltn.com.tw',
  'def.ltn.com.tw',
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
  'tw.nextapple.com',
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
const DEFAULT_BLOCKED_PATH_PATTERN = '^/(?:$|search|tag|tags|tagging|category|categories|cat|cate|topic|topics|author|authors|member|login|register|privacy|about|rss|(?:list|lists|latest|realtime|realtimenews|breaking|breaknews|hot|popular|archive|archives|video|videos|photo|photos|live)/?$)'
const CAVA_BLOCKED_PATH_PATTERN = '^/(?:$|search|tag|tags|tagging|category|categories|cat|cate|topics|author|authors|member|login|register|privacy|about|rss|(?:list|lists|latest|realtime|realtimenews|breaking|breaknews|hot|popular|archive|archives|video|videos|photo|photos|live)/?$)'
const FALLBACK_DOMAIN_CONFIGS = [
  { domain: 'cna.com.tw', article_url_pattern: '^/news/.+\\.aspx$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.cna.com.tw', article_url_pattern: '^/news/.+\\.aspx$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'news.cts.com.tw', article_url_pattern: '\\.html$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'tw.news.yahoo.com', article_url_pattern: '\\.html$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.setn.com', article_url_pattern: '^/News\\.aspx$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'udn.com', article_url_pattern: '^/news/story/\\d+/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'news.ebc.net.tw', article_url_pattern: '^/news/[^/]+/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'cava.tw', article_url_pattern: '^/(?:topic|lifestyle|money|fashion|beauty|fitness|entertainment|coverstory|survey)(?:/[^/]+)?/\\d+', blocked_path_pattern: CAVA_BLOCKED_PATH_PATTERN },
  { domain: 'news.tvbs.com.tw', article_url_pattern: '^/[^/]+/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.ftvnews.com.tw', article_url_pattern: '^/news/detail/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.nownews.com', article_url_pattern: '^/news/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.chinatimes.com', article_url_pattern: '^/(?:realtimenews|newspapers)/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'ctinews.com', article_url_pattern: '^/news/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.ctinews.com', article_url_pattern: '^/news/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'news.ltn.com.tw', article_url_pattern: '^/news/.+/(?:breakingnews/)?\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'art.ltn.com.tw', article_url_pattern: '^/article/(?:breakingnews/)?\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'def.ltn.com.tw', article_url_pattern: '^/article/(?:breakingnews/)?\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'news.pts.org.tw', article_url_pattern: '^/article/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.ettoday.net', article_url_pattern: '^/news/\\d+/.+\\.htm$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'finance.ettoday.net', article_url_pattern: '^/news/\\d+/.+\\.htm$', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.storm.mg', article_url_pattern: '^/article/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.thenewslens.com', article_url_pattern: '^/(?:article|feature)/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.mirrormedia.mg', article_url_pattern: '^/(?:story|external)/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.rti.org.tw', article_url_pattern: '^(?:/news/view/id/\\d+|/news\\?pid=\\d+)', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.taisounds.com', article_url_pattern: '^/news/content/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.upmedia.mg', article_url_pattern: '^/news_info\\.php', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'tw.nextapple.com', article_url_pattern: '^/(?:realtime|local|politics|life|entertainment|international|finance|sports)/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.businesstoday.com.tw', article_url_pattern: '^/article/category/\\d+/post/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.businessweekly.com.tw', article_url_pattern: '^/(?:business|international|management|careers|style|health|archive)/blog/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.cw.com.tw', article_url_pattern: '^/article/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'english.cw.com.tw', article_url_pattern: '^/article/article\\.action', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.taipeitimes.com', article_url_pattern: '^/News/.+/archives/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.taiwannews.com.tw', article_url_pattern: '^/news/\\d+', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.taiwanplus.com', article_url_pattern: '^/news/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.mnews.tw', article_url_pattern: '^/story/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
  { domain: 'www.cmmedia.com.tw', article_url_pattern: '^/home/articles/', blocked_path_pattern: DEFAULT_BLOCKED_PATH_PATTERN },
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
let domainConfigs = [...FALLBACK_DOMAIN_CONFIGS]
let youtubeChannels = FALLBACK_YOUTUBE_CHANNELS.map(normalizeYoutubeChannelRecord).filter(Boolean)
let journalistCache = { journalists: [], exclusions: [], fetchedAt: 0, version: '' }
let extensionNonce = null
let tooltipBox = null
let reactionTooltip = null
const tooltipStatusCache = new Map()
const tooltipStatusRequests = new Map()
const tooltipReactionCache = new Map()
const tooltipReactionRequests = new Map()
const telemetryCache = new Map()
const telemetryQueue = []
let telemetryFlushTimer = null
let articleBanner = null
let articleBannerCoach = null
let articleBannerUrl = ''
let articleBannerDismissed = false
const articleBannerStatusCache = new Map()
const articleBannerStatusRequests = new Map()
const articleBannerReportedUrls = new Set()
const articleBannerSkippedUrls = new Set()
const journalistMatchReportedUrls = new Set()
let articleBannerReactionLoading = false
let articleBannerReactionFailed = false
let articleBannerReactionSubmittingKey = ''
let articleBannerReactionMessage = ''
let articleBannerReactionMessageTimer = null
let votePanelFrame = null
let votePanelBackdrop = null
let votePanelShell = null
let votePanelUrl = ''
let votePanelPath = ''
let votePanelExtraKey = ''
let votePanelPosition = null
let votePanelCollapsed = false
let votePanelDrag = null
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
    readerReactionTitle: '脈絡需求',
    readerReactionHoverHint: 'hover 顯示',
    readerReactionEmpty: '尚無脈絡需求',
    readerReactionVote: '脈絡',
    readerReactionVoteHint: '到面板補充想看的脈絡',
    readerReactionSaved: '已送出',
    readerReactionFailed: '送出失敗',
    readerReactionLogin: '登入後補脈絡',
    eventContext: '事件',
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
    bannerCoachTitle: '這是 TruthShield 新聞提示',
    bannerCoachDesc: '點擊橫幅可開啟投票與證據面板；脈絡需求收在面板與事件頁。',
    bannerCoachOpen: '開面板',
    bannerCoachDismiss: '知道了',
  },
  en: {
    checkingLink: 'Checking this link...',
    tagUnavailable: 'Label temporarily unavailable',
    noData: 'Not enough voting data yet',
    finalized: 'Finalized',
    voteClosed: 'Voting closed',
    tooltipHint: 'TruthShield label hint',
    readerReactionTitle: 'Context request',
    readerReactionHoverHint: 'shown on hover',
    readerReactionEmpty: 'No context requests yet',
    readerReactionVote: 'Context',
    readerReactionVoteHint: 'Open the panel to request context',
    readerReactionSaved: 'Saved',
    readerReactionFailed: 'Failed',
    readerReactionLogin: 'Sign in to request context',
    eventContext: 'Event',
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
    bannerCoachTitle: 'This is the TruthShield article banner',
    bannerCoachDesc: 'Click the banner to open voting and evidence. Context requests live in the panel and event pages.',
    bannerCoachOpen: 'Open panel',
    bannerCoachDismiss: 'Got it',
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

function readExtensionLocal(keys) {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local?.get?.(keys, (payload) => resolve(payload || {}))
    } catch {
      resolve({})
    }
  })
}

function writeExtensionLocal(values) {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local?.set?.(values, () => resolve())
    } catch {
      resolve()
    }
  })
}

async function recordOnboardingStep(step) {
  const payload = await readExtensionLocal(ONBOARDING_STORAGE_KEY)
  const current = payload?.[ONBOARDING_STORAGE_KEY] || {}
  const completed = new Set(Array.isArray(current.completed_steps) ? current.completed_steps : [])
  completed.add(step)
  await writeExtensionLocal({
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

async function dismissOnboardingSurface(surface) {
  const payload = await readExtensionLocal(ONBOARDING_STORAGE_KEY)
  const current = payload?.[ONBOARDING_STORAGE_KEY] || {}
  const dismissed = new Set(Array.isArray(current.dismissed_surfaces) ? current.dismissed_surfaces : [])
  dismissed.add(surface)
  await writeExtensionLocal({
    [ONBOARDING_STORAGE_KEY]: {
      version: 1,
      completed_steps: Array.isArray(current.completed_steps) ? current.completed_steps : [],
      dismissed_surfaces: Array.from(dismissed),
      completed_at: current.completed_at || null,
      reward_claimed_at: current.reward_claimed_at || null,
      updated_at: new Date().toISOString(),
    },
  })
}

async function fetchApiViaBackground(path, options = {}) {
  const response = await sendRuntimeMessage({
    type: 'TRUTH_SHIELD_FETCH_API',
    path,
    method: options.method || 'GET',
    headers: options.headers || { Accept: 'application/json' },
    body: options.body,
  })

  if (!response?.ok) {
    throw new Error(response?.message || `status ${response?.status || 0}`)
  }

  return response.payload
}

async function syncWebAuthToExtensionStorage() {
  if (!isTruthShieldWebOrigin()) return

  const auth = readWebAuthFromLocalStorage()
  if (!auth) return

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

function scheduleStoredAuthHandoff() {
  ;[0, 150, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(postStoredAuthToVotePanelFrame, delay)
  })
}

async function loadExtensionNonce() {
  try {
    extensionNonce = await fetchApiViaBackground('/api/extension/nonce')
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
    const payload = await fetchApiViaBackground('/api/news-domains', {
      headers: extensionRequestHeaders({ Accept: 'application/json' }),
    })
    const domains = Array.isArray(payload.data)
      ? payload.data.map((item) => item.domain).filter(Boolean)
      : []

    if (domains.length > 0) {
      newsDomains = [...new Set([...FALLBACK_NEWS_DOMAINS, ...domains])]
      domainConfigs = mergeDomainConfigs(payload.data, FALLBACK_DOMAIN_CONFIGS, FALLBACK_NEWS_DOMAINS.map((domain) => ({ domain })))
      debugLog('loadNewsDomains:success', { count: newsDomains.length, matched: newsDomains.includes(window.location.hostname) })
    }
  } catch {
    newsDomains = [...FALLBACK_NEWS_DOMAINS]
    domainConfigs = mergeDomainConfigs(FALLBACK_DOMAIN_CONFIGS, FALLBACK_NEWS_DOMAINS.map((domain) => ({ domain })))
    debugLog('loadNewsDomains:failed-fallback', { count: newsDomains.length, matched: newsDomains.includes(window.location.hostname) })
  }
}

function mergeDomainConfigs(...groups) {
  const merged = new Map()

  for (const group of groups) {
    for (const config of group || []) {
      if (!config?.domain) continue
      const existing = merged.get(config.domain) || {}
      merged.set(config.domain, {
        ...existing,
        ...Object.fromEntries(
          Object.entries(config).filter(([, value]) => value !== null && value !== undefined && value !== ''),
        ),
      })
    }
  }

  return [...merged.values()]
}

async function loadYoutubeChannels() {
  try {
    const payload = await fetchApiViaBackground('/api/youtube-channels', {
      headers: extensionRequestHeaders({ Accept: 'application/json' }),
    })
    const remoteChannels = Array.isArray(payload.data)
      ? payload.data.map(normalizeYoutubeChannelRecord).filter(Boolean)
      : []

    youtubeChannels = mergeYoutubeChannels([...youtubeChannels, ...remoteChannels])
  } catch {
    youtubeChannels = FALLBACK_YOUTUBE_CHANNELS.map(normalizeYoutubeChannelRecord).filter(Boolean)
  }
}

async function loadJournalistCache() {
  const stored = await readExtensionLocal(JOURNALIST_CACHE_STORAGE_KEY)
  const cached = stored?.[JOURNALIST_CACHE_STORAGE_KEY]
  if (cached?.fetchedAt && Date.now() - Number(cached.fetchedAt) < JOURNALIST_CACHE_TTL_MS) {
    journalistCache = {
      journalists: Array.isArray(cached.journalists) ? cached.journalists : [],
      exclusions: Array.isArray(cached.exclusions) ? cached.exclusions : [],
      fetchedAt: Number(cached.fetchedAt),
      version: cached.version || '',
    }
    return journalistCache
  }

  try {
    const payload = await fetchApiViaBackground('/api/journalists/cache', {
      headers: extensionRequestHeaders({ Accept: 'application/json' }),
    })
    journalistCache = {
      journalists: Array.isArray(payload.journalists) ? payload.journalists : [],
      exclusions: Array.isArray(payload.exclusions) ? payload.exclusions : [],
      fetchedAt: Date.now(),
      version: payload.version || '',
    }
    await writeExtensionLocal({ [JOURNALIST_CACHE_STORAGE_KEY]: journalistCache })
  } catch {
    journalistCache = {
      journalists: Array.isArray(cached?.journalists) ? cached.journalists : [],
      exclusions: Array.isArray(cached?.exclusions) ? cached.exclusions : [],
      fetchedAt: Number(cached?.fetchedAt || 0),
      version: cached?.version || '',
    }
  }

  return journalistCache
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
    locale: 'auto',
  })

  TOOLTIP_ORIGIN = settings.tooltipOrigin
  API_ORIGIN = settings.apiOrigin
  enableTooltip = settings.enableTooltip
  enablePanel = settings.enablePanel
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

function domainMatchesHostname(config, hostname = window.location.hostname) {
  return hostname === config.domain || hostname.endsWith(`.${config.domain}`)
}

function matchedDomainConfig(hostname = window.location.hostname) {
  return domainConfigs
    .filter((config) => config?.domain && domainMatchesHostname(config, hostname))
    .sort((a, b) => b.domain.length - a.domain.length)[0] || null
}

function isLikelyArticlePage() {
  if (isYouTubeVideoPage()) {
    return isCurrentYouTubeNewsPage()
  }

  const matchedConfig = matchedDomainConfig()
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
      const articlePattern = new RegExp(matchedConfig.article_url_pattern)
      if (articlePattern.test(window.location.pathname) || articlePattern.test(`${window.location.pathname}${window.location.search}`)) {
        debugLog('isLikelyArticlePage:true-article-pattern', { pattern: matchedConfig.article_url_pattern })
        return true
      }
      debugLog('isLikelyArticlePage:false-article-pattern-miss', { pattern: matchedConfig.article_url_pattern })
      return false
    } catch {
      // Invalid admin-provided patterns are ignored client-side.
    }
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean)
  const path = window.location.pathname.toLowerCase()
  const listLikePath = /^\/?$/.test(path)
    || /\/(category|categories|cat|cate|section|sections|topics?|search|tag|tags|tagging|author|authors|rss)(\/|$)/.test(path)
    || /\/(latest|realtime|realtimenews|breaking|breaknews|hot|popular|archive|archives|list|lists|video|videos|photo|photos|live)\/?$/.test(path)
  if (listLikePath) {
    debugLog('isLikelyArticlePage:false-list-like-path', { path })
    return false
  }

  const fileLikeArticle = /\.(?:html?|shtml|aspx)$/i.test(path)
  const likely = fileLikeArticle || pathParts.length >= 2
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

function normalizeJournalistText(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[　,，、／/|｜:：;；()（）\[\]【】「」『』]/g, '')
    .trim()
}

function textFromSelector(selector) {
  if (!selector) return ''
  try {
    return [...document.querySelectorAll(selector)]
      .map((node) => node?.textContent || node?.getAttribute?.('content') || '')
      .join(' ')
      .trim()
      .slice(0, 320)
  } catch {
    return ''
  }
}

function jsonLdAuthorTexts() {
  const texts = []
  const visit = (value) => {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (typeof value !== 'object') return
    if (value.author) visit(value.author)
    if (value['@graph']) visit(value['@graph'])
    const name = typeof value.name === 'string' ? value.name.trim() : ''
    if (name) texts.push(name)
  }

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      visit(JSON.parse(script.textContent || 'null'))
    } catch {
      // Ignore malformed publisher JSON-LD.
    }
  }

  return [...new Set(texts)].slice(0, 8)
}

function articleAuthorCandidates() {
  const config = matchedDomainConfig()
  const candidates = []
  for (const text of jsonLdAuthorTexts()) {
    candidates.push({ source: 'json_ld', text, confidence: 'high' })
  }

  const metaSelectors = [
    'meta[name="author"][content]',
    'meta[property="article:author"][content]',
    'meta[name="parsely-author"][content]',
    'meta[name="byl"][content]',
  ]
  for (const selector of metaSelectors) {
    for (const node of document.querySelectorAll(selector)) {
      const text = node.getAttribute('content')?.trim()
      if (text) candidates.push({ source: 'meta_author', text, confidence: 'high' })
    }
  }

  const selectorText = textFromSelector(config?.author_selector)
  if (selectorText) candidates.push({ source: 'selector', text: selectorText, confidence: 'high' })

  const likelyBylineText = textFromSelector([
    '[class*="author" i]',
    '[class*="byline" i]',
    '[itemprop="author"]',
    '[rel="author"]',
  ].join(', '))
  if (likelyBylineText) candidates.push({ source: 'selector', text: likelyBylineText, confidence: 'medium' })

  const titleArea = document.querySelector('article, main, [role="main"]')?.textContent?.slice(0, 1200) || ''
  const regexes = [config?.author_regex, '記者\\s*([\\u4e00-\\u9fff]{2,4})(?:／|/|\\s)*(?:[^\\n]{0,12})報導', '文\\s*[／/]\\s*([\\u4e00-\\u9fff]{2,4})']
  for (const pattern of regexes.filter(Boolean)) {
    try {
      const match = titleArea.match(new RegExp(pattern))
      const text = match?.[1] || match?.[0] || ''
      if (text) candidates.push({ source: 'regex', text, confidence: 'medium' })
    } catch {
      // Invalid admin-provided regex is ignored.
    }
  }

  const bodyText = document.body?.innerText?.slice(0, 12000) || ''
  if (bodyText) candidates.push({ source: 'full_text', text: bodyText, confidence: 'low' })

  return candidates
}

function journalistAliasEntries(journalist) {
  const aliases = Array.isArray(journalist.aliases) ? journalist.aliases : []
  return [
    { alias: journalist.display_name, domain: journalist.media_outlet?.domain || null, confidence: 'medium' },
    { alias: journalist.canonical_name, domain: null, confidence: 'medium' },
    ...aliases,
  ].filter((entry) => entry.alias)
}

function journalistMatchExcluded(journalist, alias, domain) {
  const normalizedAlias = normalizeJournalistText(alias)
  return (journalistCache.exclusions || []).some((rule) => {
    if (rule.journalist_id && Number(rule.journalist_id) !== Number(journalist.id)) return false
    if (rule.domain && rule.domain !== domain) return false
    if (rule.alias && normalizeJournalistText(rule.alias) !== normalizedAlias) return false
    return true
  })
}

function localJournalistMatches() {
  const domain = window.location.hostname.toLowerCase()
  const candidates = articleAuthorCandidates()
  const matches = new Map()

  for (const candidate of candidates) {
    const normalizedText = normalizeJournalistText(candidate.text)
    if (!normalizedText) continue

    for (const journalist of journalistCache.journalists || []) {
      for (const aliasEntry of journalistAliasEntries(journalist)) {
        if (aliasEntry.domain && aliasEntry.domain !== domain) continue
        const normalizedAlias = normalizeJournalistText(aliasEntry.alias)
        if (!normalizedAlias || normalizedAlias.length < 2) continue
        if (!normalizedText.includes(normalizedAlias)) continue
        if (journalistMatchExcluded(journalist, aliasEntry.alias, domain)) continue

        const confidence = candidate.source === 'full_text'
          ? 'low'
          : (candidate.confidence === 'high' && aliasEntry.confidence !== 'low' ? 'high' : 'medium')
        const previous = matches.get(journalist.id)
        const rank = { high: 3, medium: 2, low: 1 }
        if (!previous || rank[confidence] > rank[previous.confidence]) {
          matches.set(journalist.id, {
            journalist_id: journalist.id,
            match_source: candidate.source,
            confidence,
            matched_text: candidate.source === 'full_text' ? aliasEntry.alias.slice(0, 120) : candidate.text.slice(0, 240),
          })
        }
      }
    }
  }

  return [...matches.values()].slice(0, 3)
}

async function reportJournalistMatchesOnce(url = window.location.href) {
  const cacheKey = canonicalStatusUrl(url)
  if (journalistMatchReportedUrls.has(cacheKey) || !isCurrentNewsPage() || !isLikelyArticlePage()) return
  journalistMatchReportedUrls.add(cacheKey)

  await loadJournalistCache()
  const matches = localJournalistMatches()
  if (!matches.length) return

  for (const match of matches) {
    try {
      await fetchApiViaBackground('/api/news/journalist-matches', {
        method: 'POST',
        headers: extensionRequestHeaders({ Accept: 'application/json', 'Content-Type': 'application/json' }),
        body: {
          news_url: cacheKey,
          journalist_id: match.journalist_id,
          match_source: match.match_source,
          confidence: match.confidence,
          matched_text: match.matched_text,
          title_snapshot: document.title || '',
          metadata: { extension_version: extensionVersion(), domain: window.location.hostname },
        },
      })
    } catch {
      // Reporter matching is best-effort and must not affect article reading.
    }
  }
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
  tooltipBox.style.pointerEvents = 'auto'
  tooltipBox.addEventListener('mouseenter', () => window.clearTimeout(hideTimer))
  tooltipBox.addEventListener('mouseleave', scheduleHideTooltip)
  document.body.appendChild(tooltipBox)

  return tooltipBox
}

function ensureReactionTooltip() {
  if (reactionTooltip && document.body.contains(reactionTooltip)) {
    return reactionTooltip
  }

  reactionTooltip = document.createElement('div')
  reactionTooltip.setAttribute('role', 'tooltip')
  reactionTooltip.style.position = 'fixed'
  reactionTooltip.style.zIndex = '2147483647'
  reactionTooltip.style.display = 'none'
  reactionTooltip.style.maxWidth = '220px'
  reactionTooltip.style.padding = '6px 8px'
  reactionTooltip.style.border = '1px solid rgba(255, 255, 255, 0.16)'
  reactionTooltip.style.borderRadius = '6px'
  reactionTooltip.style.background = 'rgba(9, 9, 11, 0.96)'
  reactionTooltip.style.boxShadow = '0 14px 34px rgba(0, 0, 0, 0.38)'
  reactionTooltip.style.color = '#f4f4f5'
  reactionTooltip.style.font = '700 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  reactionTooltip.style.lineHeight = '1.35'
  reactionTooltip.style.pointerEvents = 'none'
  reactionTooltip.style.whiteSpace = 'nowrap'
  document.body.appendChild(reactionTooltip)

  return reactionTooltip
}

function showReactionTooltip(target) {
  const text = target?.dataset?.truthshieldReactionTooltip
  if (!text) return

  const box = ensureReactionTooltip()
  const rect = target.getBoundingClientRect()
  box.textContent = text
  box.style.display = 'block'

  const boxWidth = Math.min(box.offsetWidth || 160, 220)
  const top = rect.top - box.offsetHeight - 8
  const left = rect.left + (rect.width / 2) - (boxWidth / 2)
  box.style.top = `${Math.max(8, top)}px`
  box.style.left = `${Math.max(8, Math.min(left, document.documentElement.clientWidth - boxWidth - 8))}px`
}

function hideReactionTooltip() {
  if (reactionTooltip) {
    reactionTooltip.style.display = 'none'
  }
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

function styledElement(tag, style, text = null) {
  const node = document.createElement(tag)
  if (style) node.setAttribute('style', style)
  if (text !== null) node.textContent = text
  return node
}

function replaceChildren(node, children = []) {
  node.replaceChildren(...children.filter(Boolean))
}

function reactionIcon(row, style) {
  const text = reactionTooltipText(row.label || row.key, row.count || 0)
  const icon = styledElement('span', style, row.emoji || '')
  icon.dataset.truthshieldReactionTooltip = text
  icon.title = text
  return icon
}

function reactionSummaryChip(row, compact = false) {
  const text = reactionTooltipText(row.label || row.key, row.count || 0)
  const chip = styledElement(
    'span',
    compact
      ? 'display:inline-flex;align-items:center;gap:3px;min-width:0;color:#d4d4d8;font:700 11px system-ui;'
      : 'display:inline-flex;align-items:center;gap:4px;min-width:0;max-width:160px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.04);padding:3px 7px;color:#d4d4d8;font:700 11px system-ui;',
  )
  chip.dataset.truthshieldReactionTooltip = text
  chip.title = text
  chip.appendChild(styledElement('span', 'font-size:14px;line-height:1;', row.emoji || ''))
  if (!compact) {
    chip.appendChild(styledElement('span', 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', row.label || row.key))
  }
  chip.appendChild(styledElement('span', 'color:#a1a1aa;', String(row.count || 0)))
  return chip
}

function renderTooltip(payload, loading = false, failed = false, reactionPayload = null) {
  const box = ensureTooltipBox()
  const tone = tooltipToneStyle(payload?.tone)
  box.style.borderColor = tone.border
  box.style.background = tone.background
  const reactions = reactionPayload?.hover_reactions || []
  const eventContext = relatedEventContextText(reactionPayload)
  const reactionTitle = t('readerReactionTitle')
  const reactionHint = reactions.length ? t('readerReactionHoverHint') : t('readerReactionEmpty')

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

  const wrapper = styledElement('div', 'padding: 12px 14px;')
  const header = styledElement('div', 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;')
  header.appendChild(styledElement('strong', `color:${tone.accent};font-size:12px;`, 'TruthShield'))
  header.appendChild(styledElement('span', 'color:#a1a1aa;font-size:11px;', loading ? t('checking') : t('live')))
  wrapper.appendChild(header)
  wrapper.appendChild(styledElement('div', 'font-weight:700;line-height:1.45;', displayText))
  wrapper.appendChild(styledElement('div', 'margin-top:6px;color:#d4d4d8;font-size:12px;line-height:1.45;', meta))
  if (eventContext) {
    wrapper.appendChild(styledElement('div', 'margin-top:6px;color:#a7f3d0;font-size:12px;line-height:1.45;', `${t('eventContext')}: ${eventContext}`))
  }

  const reactionSection = styledElement('div', 'margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.1);')
  const reactionHeader = styledElement('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px;')
  reactionHeader.appendChild(styledElement('span', 'color:#d4d4d8;font-size:11px;font-weight:700;', reactionTitle))
  reactionHeader.appendChild(styledElement('span', 'color:#71717a;font-size:11px;', reactionHint))
  reactionSection.appendChild(reactionHeader)
  if (reactions.length) {
    const reactionRow = styledElement('div', 'display:flex;gap:7px;margin-top:7px;')
    for (const row of reactions) {
      reactionRow.appendChild(reactionIcon(row, 'display:inline-flex;height:28px;width:28px;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(9,9,11,0.78);font-size:17px;cursor:help;'))
    }
    reactionSection.appendChild(reactionRow)
  }
  wrapper.appendChild(reactionSection)
  replaceChildren(box, [wrapper])
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

function reactionTooltipText(label, count = null) {
  const safeLabel = label || ''
  if (count === null || count === undefined || count === '') {
    return safeLabel
  }

  return `${safeLabel} · ${count}`
}

function relatedEventContextText(reactionPayload) {
  const relatedEvent = Array.isArray(reactionPayload?.related_events) ? reactionPayload.related_events[0] : null
  if (!relatedEvent) {
    return ''
  }

  return [
    relatedEvent.primary_category_label,
    relatedEvent.progress_status_label,
  ].filter(Boolean).join(' · ')
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
  const cachedReactions = getTooltipReactionCache(statusUrl)
  renderTooltip(cached?.payload || null, !cached, cached?.state === 'failed', cachedReactions?.payload || null)
  box.style.display = 'block'
  positionTooltip(anchor)
  reportExtensionEvent('tooltip_shown', true, { href_host: new URL(anchor.href).hostname, mode: 'inline_dom' })

  try {
    const [statusResult, reactionResult] = await Promise.allSettled([
      fetchTooltipStatus(statusUrl),
      fetchTooltipReactions(statusUrl),
    ])
    const payload = statusResult.status === 'fulfilled' ? statusResult.value : null
    const reactions = reactionResult.status === 'fulfilled' ? reactionResult.value : cachedReactions?.payload || null
    if (statusResult.status === 'rejected') throw statusResult.reason
    if (activeAnchor === anchor) renderTooltip(payload, false, false, reactions)
  } catch {
    if (activeAnchor === anchor) renderTooltip(null, false, true, cachedReactions?.payload || null)
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

async function fetchTooltipReactions(url) {
  const cached = getTooltipReactionCache(url)
  if (cached?.state === 'success') {
    return cached.payload
  }

  if (tooltipReactionRequests.has(url)) {
    return tooltipReactionRequests.get(url)
  }

  const request = fetchReactionSummary(url)
    .then((payload) => {
      setTooltipReactionCache(url, { state: 'success', payload })
      return payload
    })
    .catch((error) => {
      setTooltipReactionCache(url, { state: 'failed' })
      throw error
    })
    .finally(() => {
      tooltipReactionRequests.delete(url)
    })

  tooltipReactionRequests.set(url, request)
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

function getTooltipReactionCache(url) {
  const cached = tooltipReactionCache.get(url)
  if (!cached) {
    return null
  }

  if (Date.now() - cached.cachedAt > TOOLTIP_STATUS_CACHE_TTL_MS) {
    tooltipReactionCache.delete(url)
    return null
  }

  return cached
}

function setTooltipReactionCache(url, value) {
  tooltipReactionCache.set(url, { ...value, cachedAt: Date.now() })

  if (tooltipReactionCache.size <= TOOLTIP_STATUS_CACHE_MAX) {
    return
  }

  const oldestKey = tooltipReactionCache.keys().next().value
  if (oldestKey) {
    tooltipReactionCache.delete(oldestKey)
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

async function fetchReactionSummary(url) {
  const path = `/api/reactions/summary?news_url=${encodeURIComponent(url)}`

  if (chrome.runtime?.sendMessage) {
    const response = await chrome.runtime.sendMessage({ type: 'TRUTH_SHIELD_FETCH_API', path })
    if (!response?.ok) throw new Error(response?.message || `status ${response?.status || 0}`)
    return response.payload
  }

  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: extensionRequestHeaders({ Accept: 'application/json' }),
  })

  if (!response.ok) throw new Error(`status ${response.status}`)
  return response.json()
}

async function fetchArticleBannerReactions(url) {
  const path = `/api/reactions/summary?news_url=${encodeURIComponent(url)}`
  const auth = await storedExtensionAuth()
  const headers = { Accept: 'application/json' }
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`

  if (chrome.runtime?.sendMessage) {
    return fetchApiViaBackground(path, { headers })
  }

  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: extensionRequestHeaders(headers),
  })

  if (!response.ok) throw new Error(`status ${response.status}`)
  return response.json()
}

async function submitArticleBannerReaction(key) {
  const targetUrl = canonicalStatusUrl(articleBannerUrl || window.location.href)
  const auth = await storedExtensionAuth()
  if (!auth?.token) {
    openVotePanelModal(window.location.href, '/iframe-vote-panel', { tab: 'reactions' }, 'vote_panel_opened')
    return
  }

  const currentPayload = articleBannerReactionPayload(targetUrl)
  const currentReaction = currentPayload?.my_reaction || currentPayload?.reaction || null
  let feelings = Array.isArray(currentReaction?.feelings) ? [...currentReaction.feelings] : []
  const needs = Array.isArray(currentReaction?.needs) ? [...currentReaction.needs].slice(0, 3) : []

  if (feelings.includes(key)) {
    const nextFeelings = feelings.filter((item) => item !== key)
    feelings = nextFeelings.length || needs.length ? nextFeelings : feelings
  } else {
    feelings = [key, ...feelings.filter((item) => item !== key)].slice(0, 3)
  }

  articleBannerReactionSubmittingKey = key
  articleBannerReactionMessage = ''
  renderArticleBannerFromCache(articleBannerUrl || window.location.href)

  try {
    const payload = await fetchApiViaBackground('/api/reactions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: {
        news_url: targetUrl,
        feelings,
        needs,
      },
    })
    const nextPayload = {
      ...payload,
      related_events: currentPayload?.related_events || payload.related_events || [],
      my_reaction: payload.reaction || currentPayload?.my_reaction || null,
    }
    setTooltipReactionCache(targetUrl, { state: 'success', payload: nextPayload })
    articleBannerReactionFailed = false
    articleBannerReactionMessage = t('readerReactionSaved')
    reportExtensionEvent('reader_reaction_submitted', true, { mode: 'article_banner', key })
    renderArticleBannerFromCache(articleBannerUrl || window.location.href)
    scheduleArticleBannerReactionMessageClear()
  } catch (error) {
    articleBannerReactionFailed = true
    articleBannerReactionMessage = t('readerReactionFailed')
    reportExtensionEvent('reader_reaction_submitted', false, { mode: 'article_banner', key, reason: error?.message || 'failed' })
    renderArticleBannerFromCache(articleBannerUrl || window.location.href)
    scheduleArticleBannerReactionMessageClear()
  } finally {
    articleBannerReactionSubmittingKey = ''
    renderArticleBannerFromCache(articleBannerUrl || window.location.href)
  }
}

function ensureArticleBanner() {
  debugLog('ensureArticleBanner:start', { dismissed: articleBannerDismissed, href: window.location.href })
  if (articleBannerDismissed) {
    return null
  }

  if (articleBanner && document.documentElement.contains(articleBanner) && articleBannerUrl === window.location.href) {
    const container = youtubeActionContainer()
    if (!isYouTubeVideoPage() || !container || container.contains(articleBanner)) {
      recordOnboardingStep('see_article_banner').catch(() => null)
      maybeShowArticleBannerCoach().catch(() => null)
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
  articleBanner.style.boxShadow = youtubeMode ? '0 10px 30px rgba(0, 0, 0, 0.34)' : '0 1px 0 rgba(0, 0, 0, 0.26)'
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

    const reactionButton = target?.closest?.('[data-truthshield-reaction-key]')
    if (reactionButton?.dataset?.truthshieldReactionKey) {
      event.preventDefault()
      event.stopPropagation()
      submitArticleBannerReaction(reactionButton.dataset.truthshieldReactionKey)
      return
    }

    if (target?.closest?.('[data-truthshield-open-reactions]')) {
      event.preventDefault()
      event.stopPropagation()
      recordOnboardingStep('open_vote_panel').catch(() => null)
      openVotePanelModal(articleBannerUrl || window.location.href, '/iframe-vote-panel', { tab: 'reactions' }, 'vote_panel_opened')
      return
    }

    recordOnboardingStep('open_vote_panel').catch(() => null)
    ensureVotePanelFrame()
  })

  if (youtubeContainer) {
    youtubeContainer.prepend(articleBanner)
  } else {
    ;(document.body || document.documentElement).prepend(articleBanner)
  }
  debugLog('ensureArticleBanner:inserted', { mode: articleBanner.dataset.truthshieldMode, inDom: document.documentElement.contains(articleBanner) })
  renderArticleBannerFromCache(window.location.href)
  recordOnboardingStep('see_article_banner').catch(() => null)
  maybeShowArticleBannerCoach().catch(() => null)

  if (!articleBannerReportedUrls.has(window.location.href)) {
    articleBannerReportedUrls.add(window.location.href)
    reportExtensionEvent('article_banner_injected', true, { mode: youtubeMode ? (youtubeContainer ? 'youtube_action_chip' : 'youtube_floating_chip') : 'fixed_top' })
  }

  loadArticleBannerStatusOnce(window.location.href)

  return articleBanner
}

function removeArticleBanner() {
  if (articleBannerCoach?.parentNode) {
    articleBannerCoach.remove()
  }

  if (articleBanner?.parentNode) {
    articleBanner.remove()
  }

  articleBannerCoach = null
  articleBanner = null
  articleBannerUrl = ''
}

function dismissArticleBanner() {
  articleBannerDismissed = true
  removeArticleBanner()
}

async function maybeShowArticleBannerCoach() {
  if (!articleBanner || articleBanner.dataset.truthshieldMode !== 'article_bar') return
  const payload = await readExtensionLocal(ONBOARDING_STORAGE_KEY)
  const current = payload?.[ONBOARDING_STORAGE_KEY] || {}
  if (Array.isArray(current.dismissed_surfaces) && current.dismissed_surfaces.includes('banner_coach')) return
  if (articleBannerCoach && document.documentElement.contains(articleBannerCoach)) return

  articleBannerCoach = document.createElement('div')
  articleBannerCoach.setAttribute('role', 'note')
  articleBannerCoach.style.position = 'sticky'
  articleBannerCoach.style.top = '43px'
  articleBannerCoach.style.zIndex = '2147483645'
  articleBannerCoach.style.boxSizing = 'border-box'
  articleBannerCoach.style.padding = '0 14px 8px'
  articleBannerCoach.style.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  articleBannerCoach.style.colorScheme = 'normal'
  const coachInner = styledElement('div', 'max-width:1180px;margin:0 auto;border:1px solid rgba(103,232,249,.28);border-radius:8px;background:rgba(9,9,11,.96);box-shadow:0 14px 30px rgba(0,0,0,.26);padding:10px 12px;color:#e4e4e7;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;')
  const coachCopy = styledElement('div', 'min-width:0;')
  coachCopy.appendChild(styledElement('div', 'color:#cffafe;font-weight:800;font-size:12px;line-height:1.35;', t('bannerCoachTitle')))
  coachCopy.appendChild(styledElement('div', 'margin-top:3px;color:#a1a1aa;line-height:1.45;', t('bannerCoachDesc')))
  const coachActions = styledElement('div', 'display:flex;align-items:center;gap:6px;flex-shrink:0;')
  const openButton = styledElement('button', 'border:1px solid rgba(103,232,249,.5);border-radius:6px;background:rgba(103,232,249,.9);color:#09090b;padding:6px 8px;font:800 11px system-ui;cursor:pointer;white-space:nowrap;', t('bannerCoachOpen'))
  openButton.type = 'button'
  openButton.dataset.truthshieldOnboardingOpen = ''
  const dismissButton = styledElement('button', 'border:1px solid rgba(255,255,255,.14);border-radius:6px;background:rgba(255,255,255,.04);color:#d4d4d8;padding:6px 8px;font:700 11px system-ui;cursor:pointer;white-space:nowrap;', t('bannerCoachDismiss'))
  dismissButton.type = 'button'
  dismissButton.dataset.truthshieldOnboardingDismiss = ''
  coachActions.append(openButton, dismissButton)
  coachInner.append(coachCopy, coachActions)
  replaceChildren(articleBannerCoach, [coachInner])
  articleBannerCoach.querySelector('[data-truthshield-onboarding-open]')?.addEventListener('click', () => {
    recordOnboardingStep('open_vote_panel').catch(() => null)
    ensureVotePanelFrame()
  })
  articleBannerCoach.querySelector('[data-truthshield-onboarding-dismiss]')?.addEventListener('click', () => {
    dismissOnboardingSurface('banner_coach').catch(() => null)
    articleBannerCoach?.remove()
    articleBannerCoach = null
  })
  articleBanner.insertAdjacentElement('afterend', articleBannerCoach)
}

function articleBannerReactionPayload(url = articleBannerUrl || window.location.href) {
  const cacheKey = canonicalStatusUrl(url)
  return getTooltipReactionCache(cacheKey)?.payload || null
}

function articleBannerReactionOptions(payload) {
  const options = payload?.options?.feelings?.length ? payload.options.feelings : FALLBACK_REACTION_FEELINGS

  return BANNER_REACTION_KEYS
    .map((key) => options.find((option) => option.key === key) || FALLBACK_REACTION_FEELINGS.find((option) => option.key === key))
    .filter(Boolean)
}

function renderArticleBannerReactionControls(payload, compact = false) {
  const rows = (payload?.hover_reactions || []).slice(0, compact ? 2 : 3)

  if (compact) {
    if (!rows.length) return null
    const zone = styledElement('div', 'display:inline-flex;align-items:center;gap:4px;min-width:0;')
    zone.dataset.truthshieldReactionZone = ''
    zone.dataset.truthshieldOpenReactions = ''
    for (const row of rows) {
      zone.appendChild(reactionSummaryChip(row, true))
    }
    return zone
  }

  if (!rows.length) return null
  const zone = styledElement('div', 'display:inline-flex;align-items:center;gap:5px;min-width:0;flex:0 1 auto;max-width:260px;color:#d4d4d8;font:700 11px system-ui;cursor:pointer;')
  zone.dataset.truthshieldReactionZone = ''
  zone.dataset.truthshieldOpenReactions = ''
  zone.title = t('readerReactionVoteHint')
  for (const row of rows) {
    zone.appendChild(reactionSummaryChip(row))
  }
  return zone
}

function scheduleArticleBannerReactionMessageClear() {
  window.clearTimeout(articleBannerReactionMessageTimer)
  articleBannerReactionMessageTimer = window.setTimeout(() => {
    articleBannerReactionMessage = ''
    articleBannerReactionFailed = false
    renderArticleBannerFromCache(articleBannerUrl || window.location.href)
  }, 2200)
}

function buildArticleBannerBrandLink(tone, iconSize = 22, gap = 7) {
  const link = styledElement('a', `display:inline-flex;align-items:center;gap:${gap}px;color:${tone.accent};text-decoration:none;white-space:nowrap;`)
  link.dataset.truthshieldBrandLink = ''
  link.href = `${TOOLTIP_ORIGIN}/`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  const icon = styledElement('img', `width:${iconSize}px;height:${iconSize}px;display:block;`)
  icon.src = `${TOOLTIP_ORIGIN}/brand/truthshield-mark.svg`
  icon.alt = ''
  link.appendChild(icon)
  link.appendChild(styledElement('strong', 'font-size:12px;letter-spacing:0;', 'TruthShield'))
  return link
}

function buildArticleBannerOpenChip(tone, compact = false) {
  return styledElement(
    'span',
    compact
      ? `border:1px solid ${tone.border};border-radius:999px;color:${tone.accent};background:rgba(255,255,255,.04);padding:3px 7px;font:700 11px system-ui;white-space:nowrap;`
      : `border:1px solid ${tone.border};border-radius:6px;color:${tone.accent};background:rgba(255,255,255,.04);padding:5px 8px;font:700 12px system-ui;white-space:nowrap;`,
    t('open'),
  )
}

function buildArticleBannerCloseButton(compact = false) {
  const button = styledElement(
    'button',
    compact
      ? 'border:0;background:transparent;color:#a1a1aa;padding:2px 3px;font:800 13px system-ui;cursor:pointer;'
      : 'border:1px solid rgba(255,255,255,.16);border-radius:6px;background:rgba(255,255,255,.04);color:#d4d4d8;padding:6px 9px;font:700 12px system-ui;cursor:pointer;',
    '×',
  )
  button.type = 'button'
  button.dataset.truthshieldCloseBanner = ''
  button.setAttribute('aria-label', t('closeBanner'))
  return button
}

function renderArticleBanner(payload, loading = false, failed = false, reactionPayload = null) {
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
  const eventContext = relatedEventContextText(reactionPayload)
  const secondaryText = eventContext ? `${statusText} · ${eventContext}` : statusText
  const reactionControls = renderArticleBannerReactionControls(reactionPayload, articleBanner.dataset.truthshieldMode === 'youtube_chip')

  if (articleBanner.dataset.truthshieldMode === 'youtube_chip') {
    const row = styledElement('div', 'display:flex;align-items:center;gap:7px;min-width:0;flex-wrap:wrap;')
    row.appendChild(buildArticleBannerBrandLink(tone, 18, 5))
    row.appendChild(styledElement('span', 'max-width:128px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:750;line-height:1.2;', displayText))
    if (reactionControls) row.appendChild(reactionControls)
    row.appendChild(buildArticleBannerOpenChip(tone, true))
    row.appendChild(buildArticleBannerCloseButton(true))
    replaceChildren(articleBanner, [row])
    articleBanner.title = `${displayText} · ${secondaryText}`
    return
  }

  const row = styledElement('div', 'display:flex;align-items:center;gap:10px;max-width:1180px;margin:0 auto;flex-wrap:wrap;')
  row.appendChild(buildArticleBannerBrandLink(tone))
  const copy = styledElement('div', 'min-width:140px;flex:1 1 220px;')
  copy.appendChild(styledElement('div', 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:750;line-height:1.35;', displayText))
  copy.appendChild(styledElement('div', 'margin-top:1px;color:#a1a1aa;font-size:11px;line-height:1.25;', secondaryText))
  row.appendChild(copy)
  if (reactionControls) row.appendChild(reactionControls)
  row.appendChild(buildArticleBannerOpenChip(tone))
  row.appendChild(buildArticleBannerCloseButton())
  replaceChildren(articleBanner, [row])
}

function renderArticleBannerFromCache(url) {
  const cacheKey = canonicalStatusUrl(url)
  const cached = articleBannerStatusCache.get(cacheKey)
  const reactionPayload = articleBannerReactionPayload(cacheKey)

  if (cached?.state === 'success') {
    renderArticleBanner(cached.payload, false, false, reactionPayload)
    return
  }

  if (cached?.state === 'failed') {
    renderArticleBanner(null, false, true, reactionPayload)
    return
  }

  renderArticleBanner(null, true, false, reactionPayload)
}

function loadArticleBannerStatusOnce(url) {
  const cacheKey = canonicalStatusUrl(url)

  if (articleBannerStatusCache.has(cacheKey) || articleBannerStatusRequests.has(cacheKey)) {
    return
  }

  const request = fetchStatus(cacheKey)
    .then((payload) => {
      articleBannerStatusCache.set(cacheKey, { state: 'success', payload })
      if (articleBannerUrl === url) renderArticleBannerFromCache(url)
    })
    .catch(() => {
      articleBannerStatusCache.set(cacheKey, { state: 'failed' })
      if (articleBannerUrl === url) renderArticleBannerFromCache(url)
    })
    .finally(() => {
      articleBannerStatusRequests.delete(cacheKey)
    })

  articleBannerStatusRequests.set(cacheKey, request)
  loadArticleBannerReactionsOnce(url)
}

function loadArticleBannerReactionsOnce(url) {
  const cacheKey = canonicalStatusUrl(url)
  const cached = getTooltipReactionCache(cacheKey)
  if (cached?.state === 'success' || tooltipReactionRequests.has(cacheKey)) {
    return
  }

  articleBannerReactionLoading = true
  articleBannerReactionFailed = false
  renderArticleBannerFromCache(url)

  const request = fetchArticleBannerReactions(cacheKey)
    .then((payload) => {
      setTooltipReactionCache(cacheKey, { state: 'success', payload })
      articleBannerReactionFailed = false
      if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
        renderArticleBannerFromCache(url)
      }
      return payload
    })
    .catch((error) => {
      setTooltipReactionCache(cacheKey, { state: 'failed' })
      articleBannerReactionFailed = true
      throw error
    })
    .finally(() => {
      articleBannerReactionLoading = false
      tooltipReactionRequests.delete(cacheKey)
      if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
        renderArticleBannerFromCache(url)
      }
    })

  tooltipReactionRequests.set(cacheKey, request)
}

function refreshArticleBannerReactions(url = articleBannerUrl || window.location.href) {
  if (!articleBanner) return

  const cacheKey = canonicalStatusUrl(url)
  tooltipReactionCache.delete(cacheKey)
  tooltipReactionRequests.delete(cacheKey)
  articleBannerReactionLoading = false
  articleBannerReactionFailed = false
  loadArticleBannerReactionsOnce(url)
}

function clearStatusCachesForUrl(url) {
  const cacheKey = canonicalStatusUrl(url || window.location.href)
  tooltipStatusCache.delete(cacheKey)
  tooltipStatusRequests.delete(cacheKey)
  tooltipReactionCache.delete(cacheKey)
  tooltipReactionRequests.delete(cacheKey)
  articleBannerStatusCache.delete(cacheKey)
  articleBannerStatusRequests.delete(cacheKey)
}

async function refreshArticleBannerStatus(url = window.location.href, knownStatus = null) {
  const cacheKey = canonicalStatusUrl(url)

  if (knownStatus) {
    tooltipStatusRequests.delete(cacheKey)
    articleBannerStatusRequests.delete(cacheKey)
    setTooltipStatusCache(cacheKey, { state: 'success', payload: knownStatus })
    articleBannerStatusCache.set(cacheKey, { state: 'success', payload: knownStatus })
    if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
      renderArticleBannerFromCache(url)
    }
    return
  }

  const cachedBeforeRefresh = articleBannerStatusCache.get(cacheKey)
  clearStatusCachesForUrl(cacheKey)
  if (!cachedBeforeRefresh?.payload && (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey)) {
    renderArticleBannerFromCache(url)
  }

  try {
    const payload = await fetchStatus(cacheKey)
    articleBannerStatusCache.set(cacheKey, { state: 'success', payload })
    if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
      renderArticleBannerFromCache(url)
    }
  } catch {
    articleBannerStatusCache.set(cacheKey, { state: 'failed' })
    if (articleBannerUrl === url || canonicalStatusUrl(articleBannerUrl || '') === cacheKey) {
      renderArticleBannerFromCache(url)
    }
  }

  loadArticleBannerReactionsOnce(url)
}

function ensureVotePanelFrame(url = window.location.href) {
  return openVotePanelModal(url)
}

function ensureEventPinFrame(url = window.location.href, mode = 'timeline') {
  return openVotePanelModal(url, '/iframe-event-pin', { mode }, 'event_pin_opened')
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

function openVotePanelModal(targetUrl = window.location.href, panelPath = '/iframe-vote-panel', extraParams = {}, telemetryEvent = 'vote_panel_opened') {
  const extraKey = JSON.stringify(extraParams || {})
  if (votePanelBackdrop && document.body.contains(votePanelBackdrop) && votePanelUrl === targetUrl && votePanelPath === panelPath && votePanelExtraKey === extraKey) {
    return votePanelFrame
  }

  closeVotePanelModal()

  votePanelUrl = targetUrl
  votePanelPath = panelPath
  votePanelExtraKey = extraKey
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
  dragHandle.appendChild(styledElement('span', 'display:block;width:18px;height:3px;margin:6px auto 0;border-radius:999px;background:rgba(103,232,249,.72);'))

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
  votePanelFrame.addEventListener('load', scheduleStoredAuthHandoff)

  const panelUrl = new URL(panelPath, TOOLTIP_ORIGIN)
  panelUrl.searchParams.set('news_url', targetUrl)
  panelUrl.searchParams.set('expanded', '1')
  panelUrl.searchParams.set('locale', contentLocale)
  Object.entries(extraParams || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') panelUrl.searchParams.set(key, String(value))
  })
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
  scheduleStoredAuthHandoff()
  reportExtensionEvent(telemetryEvent, true, { mode: panelPath === '/iframe-vote-panel' ? 'side_panel_from_banner' : extraParams.mode || 'side_panel' })
  if (panelPath === '/iframe-vote-panel') startArticleReadTimer()

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
  votePanelPath = ''
  votePanelExtraKey = ''
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
    reportJournalistMatchesOnce(window.location.href).catch(() => null)
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

function removeReportButton() {
  document
    .querySelectorAll('[data-truthshield-domain-report-button]')
    .forEach((button) => button.remove())
}

function maybeInjectDomainReportButton() {
  // Keep missing-site reports in the context menu and popup only.
  // A persistent floating button gets in the way on article pages.
  removeReportButton()
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
    const reactionTarget = event.target?.closest?.('[data-truthshield-reaction-tooltip]')
    if (reactionTarget) {
      showReactionTooltip(reactionTarget)
    }

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
    const reactionTarget = event.target?.closest?.('[data-truthshield-reaction-tooltip]')
    if (reactionTarget && !reactionTarget.contains(event.relatedTarget)) {
      hideReactionTooltip()
    }

    const anchor = event.target.closest?.('a[href]')
    if (anchor && anchor === activeAnchor) {
      scheduleHideTooltip()
    }
  },
  true,
)

document.addEventListener(
  'focusin',
  (event) => {
    const reactionTarget = event.target?.closest?.('[data-truthshield-reaction-tooltip]')
    if (reactionTarget) {
      showReactionTooltip(reactionTarget)
    }
  },
  true,
)

document.addEventListener(
  'focusout',
  (event) => {
    const reactionTarget = event.target?.closest?.('[data-truthshield-reaction-tooltip]')
    if (reactionTarget) {
      hideReactionTooltip()
    }
  },
  true,
)

window.addEventListener('scroll', () => {
  if (tooltipBox?.style.display === 'block' && activeAnchor) {
    positionTooltip(activeAnchor)
  }
  hideReactionTooltip()
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
    refreshArticleBannerReactions()
  }

  if (isTruthShieldWebOrigin() && event.data?.type === 'TRUTH_SHIELD_AUTH_CLEARED') {
    sendRuntimeMessage({ type: 'TRUTH_SHIELD_CLEAR_AUTH' })
    refreshArticleBannerReactions()
  }

  if (event.data?.type === 'TRUTH_SHIELD_VOTE_PANEL_RESIZE' && votePanelFrame) {
    updateVotePanelShellSize(Number(event.data.height), Boolean(event.data.collapsed))
  }

  if (event.data?.type === 'TRUTH_SHIELD_AUTH_REQUEST') {
    scheduleStoredAuthHandoff()
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
    refreshArticleBannerReactions()
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
    recordOnboardingStep('open_vote_panel').catch(() => null)
    ensureVotePanelFrame(message.url || window.location.href)
    startArticleReadTimer()
    sendResponse({ ok: true })
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_RESHOW_BANNER') {
    articleBannerDismissed = false
    const banner = ensureArticleBanner()
    if (banner) {
      refreshArticleBannerStatus(message.url || window.location.href)
      sendResponse({ ok: true })
    } else {
      sendResponse({ ok: false })
    }
    return true
  }

  if (message?.type === 'TRUTH_SHIELD_SHOW_EVENT_PIN') {
    ensureEventPinFrame(message.url || window.location.href, message.mode === 'graph' ? 'graph' : 'timeline')
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
  await Promise.all([loadNewsDomains(), loadYoutubeChannels(), loadJournalistCache()])
}).finally(async () => {
  installPageAuthBridge()
  requestPageAuthState()
  await syncWebAuthToExtensionStorage()
  if (enablePanel) maybeInjectVotePanel()
  maybeInjectDomainReportButton()
  observeArticleChanges()
})
