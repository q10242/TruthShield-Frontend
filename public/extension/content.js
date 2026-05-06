let TOOLTIP_ORIGIN = 'http://localhost:15173'
let API_ORIGIN = 'http://localhost:18080'
const HOVER_DELAY_MS = 300
let enableTooltip = true
let enablePanel = true
let enableReportButton = true
const FALLBACK_NEWS_DOMAINS = [
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
]

let newsDomains = [...FALLBACK_NEWS_DOMAINS]
let domainConfigs = []
let tooltipFrame = null
let votePanelFrame = null
let votePanelUrl = ''
let reportButton = null
let activeAnchor = null
let hideTimer = null
let hoverTimer = null
let articleReadSeconds = 0
let articleReadTimer = null

function extensionVersion() {
  try {
    return chrome.runtime?.getManifest?.().version || null
  } catch {
    return null
  }
}

function reportExtensionEvent(eventType, success = true, metadata = {}) {
  try {
    fetch(`${API_ORIGIN}/api/extension/events`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: window.location.hostname,
        event_type: eventType,
        extension_version: extensionVersion(),
        success,
        metadata,
      }),
    }).catch(() => null)
  } catch {
    // Telemetry must never break page behavior.
  }
}

function reportSelectorCheck(checkType, success, selector = null, metadata = {}) {
  try {
    fetch(`${API_ORIGIN}/api/extension/selector-checks`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
      headers: { Accept: 'application/json' },
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
  })

  TOOLTIP_ORIGIN = settings.tooltipOrigin
  API_ORIGIN = settings.apiOrigin
  enableTooltip = settings.enableTooltip
  enablePanel = settings.enablePanel
  enableReportButton = settings.enableReportButton
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

  const pathParts = window.location.pathname.split('/').filter(Boolean)
  return pathParts.length >= 2 || window.location.pathname.includes('news')
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

function ensureTooltipFrame() {
  if (tooltipFrame) {
    return tooltipFrame
  }

  tooltipFrame = document.createElement('iframe')
  tooltipFrame.title = 'TruthShield credibility tooltip'
  tooltipFrame.style.position = 'absolute'
  tooltipFrame.style.zIndex = '2147483647'
  tooltipFrame.style.width = '380px'
  tooltipFrame.style.height = '150px'
  tooltipFrame.style.border = '0'
  tooltipFrame.style.borderRadius = '8px'
  tooltipFrame.style.background = 'transparent'
  tooltipFrame.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.35)'
  tooltipFrame.style.display = 'none'
  tooltipFrame.addEventListener('mouseover', () => window.clearTimeout(hideTimer))
  tooltipFrame.addEventListener('mouseout', scheduleHideTooltip)
  document.body.appendChild(tooltipFrame)

  return tooltipFrame
}

function positionTooltip(anchor) {
  const rect = anchor.getBoundingClientRect()
  const top = window.scrollY + rect.bottom + 8
  const maxLeft = window.scrollX + document.documentElement.clientWidth - 400
  const left = Math.min(window.scrollX + rect.left, maxLeft)

  tooltipFrame.style.top = `${Math.max(8, top)}px`
  tooltipFrame.style.left = `${Math.max(8, left)}px`
}

function showTooltip(anchor) {
  window.clearTimeout(hideTimer)
  activeAnchor = anchor

  const frame = ensureTooltipFrame()
  const tooltipUrl = new URL('/iframe-tooltip', TOOLTIP_ORIGIN)
  tooltipUrl.searchParams.set('news_url', anchor.href)

  frame.src = tooltipUrl.toString()
  frame.style.display = 'block'
  positionTooltip(anchor)
  reportExtensionEvent('tooltip_shown', true, { href_host: new URL(anchor.href).hostname })
}

function ensureVotePanelFrame() {
  if (votePanelFrame && document.body.contains(votePanelFrame) && votePanelUrl === window.location.href) {
    return votePanelFrame
  }

  if (votePanelFrame && document.body.contains(votePanelFrame)) {
    votePanelFrame.remove()
  }

  votePanelFrame = document.createElement('iframe')
  votePanelUrl = window.location.href
  votePanelFrame.title = 'TruthShield news vote panel'
  votePanelFrame.style.zIndex = '2147483646'
  votePanelFrame.style.height = '74px'
  votePanelFrame.style.border = '0'
  votePanelFrame.style.borderRadius = '8px'
  votePanelFrame.style.background = 'transparent'
  votePanelFrame.style.display = 'block'
  votePanelFrame.style.colorScheme = 'normal'

  const panelUrl = new URL('/iframe-vote-panel', TOOLTIP_ORIGIN)
  panelUrl.searchParams.set('news_url', window.location.href)
  votePanelFrame.src = panelUrl.toString()

  const mount = findArticleMount()

  if (mount) {
    votePanelFrame.style.position = 'relative'
    votePanelFrame.style.width = '100%'
    votePanelFrame.style.maxWidth = '760px'
    votePanelFrame.style.margin = '24px auto'
    votePanelFrame.style.boxShadow = 'none'
    mount.insertAdjacentElement('afterend', votePanelFrame)
    reportExtensionEvent('vote_panel_injected', true, { mode: 'article_mount' })
    reportSelectorCheck('article_mount_runtime', true, mount.tagName.toLowerCase(), { mode: 'article_mount' })
  } else {
    votePanelFrame.style.position = 'fixed'
    votePanelFrame.style.right = '16px'
    votePanelFrame.style.bottom = '16px'
    votePanelFrame.style.width = '380px'
    document.body.appendChild(votePanelFrame)
    reportExtensionEvent('vote_panel_injected', true, { mode: 'fixed_fallback' })
    reportSelectorCheck('article_mount_runtime', false, null, { mode: 'fixed_fallback' })
  }

  return votePanelFrame
}

function maybeInjectVotePanel() {
  if (!isCurrentNewsPage() || !isLikelyArticlePage()) {
    if (isCurrentNewsPage()) reportExtensionEvent('vote_panel_skipped', false, { reason: 'not_article_shape' })
    return
  }

  ensureVotePanelFrame()
  startArticleReadTimer()
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

function schedulePageInjection() {
  window.clearTimeout(schedulePageInjection.timer)
  schedulePageInjection.timer = window.setTimeout(() => {
    if (enablePanel) maybeInjectVotePanel()
    maybeInjectDomainReportButton()
  }, 350)
}

function observeArticleChanges() {
  let currentHref = window.location.href
  const observer = new MutationObserver(() => {
    if (currentHref !== window.location.href) {
      currentHref = window.location.href
      votePanelUrl = ''
      articleReadSeconds = 0
    }

    schedulePageInjection()
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}

function ensureReportButton() {
  if (reportButton) {
    return reportButton
  }

  reportButton = document.createElement('button')
  reportButton.type = 'button'
  reportButton.textContent = '回報未收錄新聞站'
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

function findArticleMount() {
  const matchedConfig = domainConfigs.find((config) => {
    if (!config.article_selector) return false
    return window.location.hostname === config.domain || window.location.hostname.endsWith(`.${config.domain}`)
  })

  const selectors = [
    matchedConfig?.article_selector,
    'article[itemtype*="NewsArticle"]',
    '[itemtype*="NewsArticle"]',
    '[data-testid*="article"]',
    '[class*="article-body"]',
    '[class*="story-body"]',
    'article',
    'main article',
    '[role="main"] article',
    '.article',
    '.article-content',
    '.news-content',
    '.story',
    'main',
    '[role="main"]',
  ]

  for (const selector of selectors.filter(Boolean)) {
    const element = document.querySelector(selector)
    if (element && element.getBoundingClientRect().height > 240) {
      return element
    }
  }

  return null
}

function scheduleTooltip(anchor) {
  window.clearTimeout(hoverTimer)
  hoverTimer = window.setTimeout(() => {
    if (activeAnchor === anchor || document.body.contains(anchor)) {
      showTooltip(anchor)
    }
  }, HOVER_DELAY_MS)
}

function scheduleHideTooltip() {
  window.clearTimeout(hoverTimer)
  hideTimer = window.setTimeout(() => {
    if (tooltipFrame) {
      tooltipFrame.style.display = 'none'
    }
    activeAnchor = null
  }, 180)
}

document.addEventListener(
  'mouseover',
  (event) => {
    const anchor = event.target.closest?.('a[href]')
    if (!enableTooltip || !anchor || !isNewsLink(anchor)) {
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
  if (tooltipFrame?.style.display === 'block' && activeAnchor) {
    positionTooltip(activeAnchor)
  }
})

window.addEventListener('message', (event) => {
  if (event.origin !== TOOLTIP_ORIGIN) {
    return
  }

  if (event.data?.type === 'TRUTH_SHIELD_TOOLTIP_RESIZE' && tooltipFrame) {
    const height = Number(event.data.height)
    tooltipFrame.style.height = `${Math.max(110, Math.min(height, 210))}px`
  }

  if (event.data?.type === 'TRUTH_SHIELD_VOTE_PANEL_RESIZE' && votePanelFrame) {
    const height = Number(event.data.height)
    votePanelFrame.style.height = `${Math.max(70, Math.min(height, 620))}px`
  }
})

loadSettings().then(loadNewsDomains).finally(() => {
  if (enablePanel) maybeInjectVotePanel()
  maybeInjectDomainReportButton()
  observeArticleChanges()
})
