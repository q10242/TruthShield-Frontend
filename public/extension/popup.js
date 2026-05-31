const defaults = {
  tooltipOrigin: 'https://truth-shield.otus.tw',
  apiOrigin: 'https://truth-shield-api.otus.tw',
  locale: 'auto',
}

const state = {
  settings: defaults,
  tab: null,
  auth: null,
  pageContext: null,
  onboardingDismissed: false,
}
const t = window.truthShieldT || ((key) => key)

function hasExtensionContext() {
  return typeof chrome !== 'undefined'
    && Boolean(chrome.runtime?.getManifest)
    && Boolean(chrome.storage?.sync)
    && Boolean(chrome.storage?.local)
    && Boolean(chrome.tabs?.query)
}

function byId(id) {
  return document.getElementById(id)
}

function setStatus(message, danger = false) {
  byId('status').textContent = message
  byId('status').style.color = danger ? '#fca5a5' : '#86efac'
}

function normalizeOrigin(value, fallback) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return fallback
  return trimmed.replace(/\/+$/, '')
}

function normalizedSettings(settings) {
  return {
    ...defaults,
    ...settings,
    tooltipOrigin: normalizeOrigin(settings?.tooltipOrigin, defaults.tooltipOrigin),
    apiOrigin: normalizeOrigin(settings?.apiOrigin, defaults.apiOrigin),
  }
}

function usingProductionOrigins() {
  return state.settings.tooltipOrigin === defaults.tooltipOrigin
    && state.settings.apiOrigin === defaults.apiOrigin
}

function renderOriginWarning() {
  const card = byId('originWarning')
  if (!card) return

  const customOrigins = !usingProductionOrigins()
  card.hidden = !customOrigins
  const text = byId('originWarningText')
  if (text && customOrigins) {
    text.textContent = t('originWarningBody', {
      web: state.settings.tooltipOrigin,
      api: state.settings.apiOrigin,
    })
  }
}

function updateOnboardingVisibility() {
  const onboarding = byId('onboarding')
  if (!onboarding) return

  onboarding.hidden = Boolean(state.auth?.token) || state.onboardingDismissed
}

function setPageContextSummary(textKey, badgeKey, tone = 'ok') {
  const summary = byId('popupSummary')
  const badge = byId('pageContextBadge')
  if (summary) summary.textContent = t(textKey)
  if (!badge) return
  badge.textContent = t(badgeKey)
  badge.classList.remove('warn', 'bad')
  if (tone === 'warn') badge.classList.add('warn')
  if (tone === 'bad') badge.classList.add('bad')
}

function selectedLocale() {
  return state.settings.locale === 'zh-TW' || state.settings.locale === 'en'
    ? state.settings.locale
    : (navigator.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en')
}

function applyStaticEventLabels() {
  const refreshBtn = byId('detail-refresh-btn')
  if (!refreshBtn) return
  const label = t('detailRefresh')
  refreshBtn.title = label
  refreshBtn.setAttribute('aria-label', label)
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

function sourceTypeLabel(sourceType) {
  const map = {
    news: 'timelineSourceNews',
    evidence: 'timelineSourceEvidence',
    official_response: 'timelineSourceOfficialResponse',
    external: 'timelineSourceExternal',
  }
  return t(map[sourceType] || 'timelineSourceUnknown')
}

function reportParamsFromContext(context = {}) {
  let domain = context.hostname || ''
  try {
    domain ||= new URL(currentUrl()).hostname
  } catch {
    domain = ''
  }

  const classificationIssue = Boolean(context.isTrackedNews && !context.isLikelyArticle)

  return {
    url: currentUrl(),
    page_title: currentTitle(),
    domain,
    tab: classificationIssue ? 'classification' : 'domain',
    report_type: classificationIssue ? 'classification' : 'missing_domain',
    youtube_channel_url: context.youtubeChannelUrl,
  }
}

function openTab(url) {
  chrome.tabs.create({ url })
}

function openWindow(url, width = 460, height = 720) {
  chrome.windows.create({ url, type: 'popup', width, height, focused: true }, () => {
    if (chrome.runtime.lastError) {
      chrome.tabs.create({ url })
    }
  })
}

function openAuthSyncWindow() {
  openWindow(truthUrl('/extension-auth-sync', { close: '1' }), 360, 260)
}

function writeSyncSettings(values) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(values, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
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

async function syncAuthFromActiveTab() {
  if (!state.tab?.id) return null

  try {
    const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_SYNC_WEB_AUTH' })
    return response?.auth || null
  } catch {
    return null
  }
}

async function loadAuthSummary() {
  const auth = await syncAuthFromActiveTab() || await storedAuth()
  state.auth = auth
  const authStatus = byId('authStatus')
  const authUser = byId('authUser')
  const openLogin = byId('openLogin')
  const signOut = byId('signOut')

  if (auth?.token) {
    const user = auth.user || {}
    authStatus.textContent = t('authSignedIn')
    authStatus.style.color = '#cffafe'
    authUser.textContent = user.display_name || user.name || user.email || t('authHint')
    openLogin.hidden = true
    signOut.hidden = false
    await loadAchievementSummary(auth)
    updateOnboardingVisibility()
    return
  }

  authStatus.textContent = t('authSignedOut')
  authStatus.style.color = '#fef3c7'
  authUser.textContent = t('authOpenHub')
  openLogin.hidden = false
  signOut.hidden = true
  byId('achievementCard').hidden = true
  updateOnboardingVisibility()
}

async function loadAchievementSummary(auth) {
  const card = byId('achievementCard')
  const text = byId('achievementText')
  if (!auth?.token) {
    card.hidden = true
    return
  }

  try {
    const res = await fetch(`${state.settings.apiOrigin}/api/me/profile`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${auth.token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const profile = await res.json()
    const next = (profile.achievements || []).find((item) => !item.unlocked)
    const count = profile.achievement_summary?.unlocked_count ?? 0
    const total = profile.achievement_summary?.total_count ?? profile.achievements?.length ?? 0
    text.textContent = next
      ? t('achievementNext', { count, total, name: next.name, current: next.current, target: next.target })
      : t('achievementDone', { count, total })
    card.hidden = false
  } catch {
    card.hidden = true
  }
}

async function resyncAuth() {
  const btn = byId('resyncAuth')
  btn.disabled = true
  setStatus(t('authSyncing'))

  try {
    await syncAuthFromActiveTab()
    await loadAuthSummary()
    if (state.auth?.token) {
      setStatus(t('authSynced'))
      return
    }

    openAuthSyncWindow()
    setStatus(t('authSyncOpened'))
  } finally {
    btn.disabled = false
  }
}

async function resetProductionOrigins() {
  const btn = byId('resetProductionOrigins')
  btn.disabled = true
  setStatus(t('productionOriginsRestoring'))

  try {
    await writeSyncSettings({
      tooltipOrigin: defaults.tooltipOrigin,
      apiOrigin: defaults.apiOrigin,
    })
    state.settings = normalizedSettings({
      ...state.settings,
      tooltipOrigin: defaults.tooltipOrigin,
      apiOrigin: defaults.apiOrigin,
    })
    renderOriginWarning()
    setStatus(t('productionOriginsRestored'))
    await loadPageDebug()
    await loadAuthSummary()
    await loadSummary()
  } catch {
    setStatus(t('productionOriginsRestoreFailed'), true)
  } finally {
    btn.disabled = false
  }
}

async function notifyActiveTabLogout() {
  if (!state.tab?.id) return

  try {
    await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_EXTENSION_LOGOUT' })
  } catch {
    // Active tab may not have TruthShield content script access.
  }
}

async function signOut() {
  const auth = state.auth || await storedAuth()
  byId('signOut').disabled = true
  setStatus(t('signingOut'))

  if (auth?.token) {
    fetch(`${state.settings.apiOrigin}/api/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${auth.token}` },
      keepalive: true,
    }).catch(() => null)
  }

  await sendRuntimeMessage({ type: 'TRUTH_SHIELD_CLEAR_AUTH' })
  await notifyActiveTabLogout()
  openWindow(truthUrl('/extension-auth-sync', { action: 'logout', close: '1' }), 360, 260)
  trackPopupEvent('auth_logout', 'popup_auth')
  state.auth = null
  await loadAuthSummary()
  byId('signOut').disabled = false
  setStatus(t('signedOut'))
}

async function currentPageContext() {
  if (!state.tab?.id) {
    return {}
  }

  try {
    const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_GET_PAGE_CONTEXT' })
    return response?.ok ? response : {}
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: state.tab.id },
        files: ['content.js'],
      })
      const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_GET_PAGE_CONTEXT' })
      return response?.ok ? response : {}
    } catch {
      return {}
    }
  }
}

async function loadPageDebug() {
  const debug = byId('pageDebug')
  if (!state.tab?.id || !debug) return

  const pill = (ok, labelOk, labelBad, warn = false) => {
    const cls = ok ? 'ok' : warn ? 'warn' : 'bad'
    return `<span class="debug-pill ${cls}">${escapeHtml(ok ? labelOk : labelBad)}</span>`
  }
  const row = (label, valueHtml) => `<div class="debug-row"><span>${escapeHtml(label)}</span>${valueHtml}</div>`

  try {
    const context = await currentPageContext()
    state.pageContext = context
    const isSupported = Boolean(context?.ok)
    const isTracked = Boolean(context?.isTrackedNews)
    const isArticle = Boolean(context?.isLikelyArticle)
    const bannerVisible = Boolean(context?.hasArticleBanner)
    const bannerDismissed = Boolean(context?.articleBannerDismissed)

    if (!isSupported) setPageContextSummary('popupSummaryUnsupported', 'popupBadgeUnsupported', 'bad')
    else if (isTracked && isArticle) setPageContextSummary('popupSummaryTrackedArticle', 'popupBadgeReady', 'ok')
    else if (isTracked) setPageContextSummary('popupSummaryTrackedNonArticle', 'popupBadgeMonitorOnly', 'warn')
    else setPageContextSummary('popupSummaryUntracked', 'popupBadgeUntracked', 'warn')

    debug.innerHTML = [
      row(t('diagContentScript'), pill(isSupported, t('diagOk'), t('diagNotRunning'))),
      row(t('diagTrackedDomain'), pill(isTracked, t('diagTracked'), t('diagNotTracked'), isSupported && !isTracked)),
      row(t('diagArticlePage'), pill(isArticle, t('diagArticle'), t('diagNotArticle'), isSupported && isTracked && !isArticle)),
      row(t('diagBanner'), pill(bannerVisible, t('diagShown'), bannerDismissed ? t('diagDismissed') : t('diagNotShown'), isSupported && isTracked && isArticle && !bannerVisible)),
    ].join('')

    byId('pageDebugHint').textContent = isSupported
      ? [
          context.hostname || '',
          context.matchedDomain ? `${t('diagMatched')}: ${context.matchedDomain}` : '',
          context.domainCount ? `${t('diagDomainCount')}: ${context.domainCount}` : '',
        ].filter(Boolean).join(' · ')
      : t('diagNoContentHint')
  } catch (error) {
    setPageContextSummary('popupSummaryUnsupported', 'popupBadgeUnsupported', 'bad')
    debug.innerHTML = row(t('diagContentScript'), pill(false, t('diagOk'), t('diagNotRunning')))
    byId('pageDebugHint').textContent = error.message || t('diagNoContentHint')
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

async function reshowBanner() {
  if (!state.tab?.id) return
  try {
    const response = await chrome.tabs.sendMessage(state.tab.id, { type: 'TRUTH_SHIELD_RESHOW_BANNER', url: currentUrl() })
    setStatus(response?.ok ? t('bannerReshown') : t('bannerReshowFailed'), !response?.ok)
    await loadPageDebug()
  } catch {
    setStatus(t('bannerReshowFailed'), true)
  }
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

// ─── Events tab state & helpers ───────────────────────────────────────────────

const eventsState = {
  query: '',
  selectedEventId: null,
  selectedEventName: '',
  activeDetailTab: 'timeline',
  cache: { timeline: {}, graph: {} },
}

async function apiGet(path) {
  const res = await fetch(`${state.settings.apiOrigin}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function setBodyWidth(px) {
  document.body.style.width = `${px}px`
}

function showMainTab(name) {
  byId('panel-status').hidden = name !== 'status'
  byId('panel-events').hidden = name !== 'events'
  byId('panel-event-detail').hidden = name !== 'event-detail'
  byId('tab-status').classList.toggle('tab-active', name === 'status')
  byId('tab-events').classList.toggle('tab-active', name === 'events' || name === 'event-detail')

  if (name === 'status') setBodyWidth(330)
  else if (name === 'events') setBodyWidth(380)
  else if (name === 'event-detail') {
    setBodyWidth(eventsState.activeDetailTab === 'graph' ? 540 : 420)
  }
}

function showDetailTab(name) {
  eventsState.activeDetailTab = name
  byId('detail-timeline-content').hidden = name !== 'timeline'
  byId('detail-graph-content').hidden = name !== 'graph'
  byId('detail-tab-timeline').classList.toggle('tab-active', name === 'timeline')
  byId('detail-tab-graph').classList.toggle('tab-active', name === 'graph')
  setBodyWidth(name === 'graph' ? 540 : 420)
}

async function loadEvents() {
  const container = byId('events-list-content')
  container.innerHTML = `<p class="panel-msg">${t('eventsLoading')}</p>`
  try {
    const q = encodeURIComponent(eventsState.query)
    const payload = await apiGet(`/api/events?q=${q}&limit=8`)
    renderEventsList(payload.data || [])
  } catch (err) {
    container.innerHTML = `<p class="panel-err">${t('eventsError')}：${escapeHtml(err.message)}</p>`
  }
}

function renderEventsList(events) {
  const container = byId('events-list-content')
  if (!events.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${escapeHtml(t('eventsEmptyTitle'))}</p>
        <p>${escapeHtml(t('eventsEmptyHint'))}</p>
      </div>`
    return
  }
  container.innerHTML = events.map((ev) => {
    const c = ev.counts || {}
    return `
      <div class="event-item">
        <div class="event-name">${escapeHtml(ev.name)}</div>
        <div class="event-meta">${escapeHtml(t('eventsCounts', {
          timeline: c.timeline ?? 0,
          relationships: c.relationships ?? 0,
          items: c.items ?? 0,
        }))}</div>
        <div class="event-actions">
          <button class="btn-sm cyan" data-eid="${ev.id}" data-ename="${escapeHtml(ev.name)}" data-act="pin">${escapeHtml(t('eventsPin'))}</button>
          <button class="btn-sm" data-eid="${ev.id}" data-ename="${escapeHtml(ev.name)}" data-act="timeline">${t('eventsTimeline')}</button>
          <button class="btn-sm" data-eid="${ev.id}" data-ename="${escapeHtml(ev.name)}" data-act="graph">${t('eventsGraph')}</button>
          <a class="btn-sm" href="${escapeHtml(state.settings.tooltipOrigin)}/events/${ev.id}" target="_blank" rel="noopener noreferrer">${t('eventsOpenPage')}</a>
        </div>
      </div>`
  }).join('')

  container.querySelectorAll('[data-act]').forEach((btn) => {
    const { eid, ename, act } = btn.dataset
    if (act === 'pin') btn.addEventListener('click', () => openPinToEvent(eid))
    else btn.addEventListener('click', () => openEventDetail(eid, ename, act))
  })
}

function openCreateEvent() {
  openWindow(truthUrl('/iframe-event-pin', {
    mode: 'timeline',
    news_url: currentUrl(),
    title_snapshot: currentTitle(),
  }), 460, 680)
}

function openPinToEvent(eventId) {
  openWindow(truthUrl('/iframe-event-pin', {
    mode: 'timeline',
    event_id: eventId,
    news_url: currentUrl(),
    title_snapshot: currentTitle(),
  }), 460, 680)
}

function openAddTimeline(eventId) {
  delete eventsState.cache.timeline[eventId]
  openWindow(truthUrl('/iframe-event-pin', {
    mode: 'timeline',
    news_url: currentUrl(),
    title_snapshot: currentTitle(),
    event_id: eventId,
  }), 460, 680)
}

function openAddGraph(eventId) {
  delete eventsState.cache.graph[eventId]
  openWindow(truthUrl('/iframe-event-pin', {
    mode: 'graph',
    news_url: currentUrl(),
    title_snapshot: currentTitle(),
    event_id: eventId,
  }), 460, 680)
}

async function openEventDetail(eventId, eventName, tab) {
  eventsState.selectedEventId = eventId
  eventsState.selectedEventName = eventName
  byId('detail-event-name').textContent = eventName
  showMainTab('event-detail')
  showDetailTab(tab)

  if (tab === 'timeline') await renderTimeline(eventId)
  else await renderGraph(eventId)
}

function formatEntryDate(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value).slice(0, 16)
    return d.toLocaleString(selectedLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch { return String(value).slice(0, 16) }
}

async function renderTimeline(eventId) {
  const container = byId('detail-timeline-content')
  if (eventsState.cache.timeline[eventId]) {
    container.innerHTML = eventsState.cache.timeline[eventId]
    bindTimelineAddBtn(eventId)
    return
  }
  container.innerHTML = `<p class="panel-msg">${t('eventsLoading')}</p>`
  try {
    const payload = await apiGet(`/api/events/${encodeURIComponent(eventId)}/timeline`)
    const entries = payload.data || []
    const listHtml = entries.length
      ? `<div class="tl-list">${entries.map((entry) => `
          <div class="tl-entry">
            <div class="tl-time">${escapeHtml(formatEntryDate(entry.occurred_at))} · ${escapeHtml(sourceTypeLabel(entry.source_type))}</div>
            <div class="tl-title">${escapeHtml(entry.title || '')}</div>
            ${entry.summary ? `<div class="tl-summary">${escapeHtml(entry.summary)}</div>` : ''}
            ${entry.source_url ? `<a class="tl-link" href="${escapeHtml(entry.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.source_url.length > 60 ? entry.source_url.slice(0, 60) + '…' : entry.source_url)}</a>` : ''}
          </div>`).join('')}</div>`
      : `<p class="panel-msg">${t('detailTimelineEmpty')}</p>`
    const html = `<button class="btn-sm cyan add-btn" id="add-timeline-btn">${escapeHtml(t('detailAddTimeline'))}</button>${listHtml}`
    eventsState.cache.timeline[eventId] = html
    container.innerHTML = html
    bindTimelineAddBtn(eventId)
  } catch (err) {
    container.innerHTML = `<p class="panel-err">${t('eventsError')}：${escapeHtml(err.message)}</p>`
  }
}

function bindTimelineAddBtn(eventId) {
  const btn = byId('add-timeline-btn')
  if (btn) btn.addEventListener('click', () => openAddTimeline(eventId))
}

async function renderGraph(eventId) {
  const container = byId('detail-graph-content')
  if (eventsState.cache.graph[eventId]) {
    container.innerHTML = ''
    container.appendChild(buildAddGraphBtn(eventId))
    container.appendChild(eventsState.cache.graph[eventId].cloneNode(true))
    return
  }
  container.innerHTML = `<p class="panel-msg">${t('eventsLoading')}</p>`
  try {
    const payload = await apiGet(`/api/events/${encodeURIComponent(eventId)}/graph`)
    const entities = payload.entities || []
    const relationships = payload.relationships || []
    container.innerHTML = ''
    container.appendChild(buildAddGraphBtn(eventId))
    if (!entities.length) {
      const msg = document.createElement('p')
      msg.className = 'panel-msg'
      msg.textContent = t('detailGraphEmpty')
      container.appendChild(msg)
      return
    }
    const svg = buildGraphSvg(entities, relationships)
    eventsState.cache.graph[eventId] = svg
    container.appendChild(svg)
  } catch (err) {
    container.innerHTML = `<p class="panel-err">${t('eventsError')}：${escapeHtml(err.message)}</p>`
  }
}

function buildAddGraphBtn(eventId) {
  const btn = document.createElement('button')
  btn.className = 'btn-sm cyan add-btn'
  btn.textContent = t('detailAddGraph')
  btn.addEventListener('click', () => openAddGraph(eventId))
  return btn
}

function graphCirclePosition(index, total) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2
  return { x: 250 + Math.cos(angle) * 175, y: 185 + Math.sin(angle) * 145 }
}

function graphHeat(ratio, isOrg) {
  if (ratio >= 0.75) return { fill: '#be123c', stroke: '#fecdd3' }
  if (ratio >= 0.5) return { fill: '#b45309', stroke: '#fde68a' }
  if (ratio >= 0.25) return { fill: '#0f766e', stroke: '#99f6e4' }
  return { fill: isOrg ? '#1e3a5f' : '#27272a', stroke: '#67e8f9' }
}

function buildGraphSvg(entities, relationships) {
  const positions = entities.map((entity, index) => {
    const saved = entity.metadata?.graph_position
    if (saved && isFinite(+saved.x) && isFinite(+saved.y)) return { x: +saved.x, y: +saved.y }
    return graphCirclePosition(index, entities.length)
  })

  const degrees = new Map()
  for (const e of entities) degrees.set(e.id, 0)
  for (const rel of relationships) {
    degrees.set(rel.from_entity_id, (degrees.get(rel.from_entity_id) || 0) + 1)
    degrees.set(rel.to_entity_id, (degrees.get(rel.to_entity_id) || 0) + 1)
  }
  const maxDeg = Math.max(1, ...Array.from(degrees.values()))

  const svgNs = 'http://www.w3.org/2000/svg'
  const el = (tag, attrs = {}, text) => {
    const node = document.createElementNS(svgNs, tag)
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
    if (text != null) node.textContent = text
    return node
  }

  const svg = el('svg', { viewBox: '0 0 500 370', width: '500', height: '370' })
  svg.style.cssText = 'background:#09090b;border-radius:8px;border:1px solid #27272a;display:block'

  const defs = el('defs')
  const makeMarker = (id, color) => {
    const m = el('marker', { id, viewBox: '0 0 8 8', refX: '6.8', refY: '4', markerWidth: '4', markerHeight: '4', orient: 'auto-start-reverse' })
    m.appendChild(el('path', { d: 'M 0 0 L 8 4 L 0 8 z', fill: color }))
    return m
  }
  defs.appendChild(makeMarker('pg-arrow-cyan', '#67e8f9'))
  defs.appendChild(makeMarker('pg-arrow-orange', '#f97316'))
  svg.appendChild(defs)
  svg.appendChild(el('rect', { width: '500', height: '370', fill: '#09090b' }))

  for (const rel of relationships) {
    const fi = entities.findIndex((e) => e.id === rel.from_entity_id)
    const ti = entities.findIndex((e) => e.id === rel.to_entity_id)
    if (fi < 0 || ti < 0) continue
    const from = positions[fi]
    const to = positions[ti]
    const fromR = (entities[fi].entity_type === 'organization' ? 28 : 22) + 3
    const toR = (entities[ti].entity_type === 'organization' ? 28 : 22) + 8
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const x1 = from.x + (dx / dist) * fromR
    const y1 = from.y + (dy / dist) * fromR
    const x2 = to.x - (dx / dist) * toR
    const y2 = to.y - (dy / dist) * toR
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const isRisk = rel.is_high_risk
    const markerId = isRisk ? 'pg-arrow-orange' : 'pg-arrow-cyan'

    const relGroup = el('g')
    const line = el('line', { x1, y1, x2, y2, stroke: isRisk ? '#f97316' : '#67e8f9', 'stroke-width': '2', opacity: '0.65', 'marker-end': `url(#${markerId})` })
    line.appendChild(el('title', {}, `${entities[fi].name} -> ${entities[ti].name}${rel.relationship_type ? ` (${rel.relationship_type})` : ''}`))
    relGroup.appendChild(line)

    const label = String(rel.relationship_type || '').slice(0, 10)
    if (label) {
      const lw = label.length * 7 + 14
      relGroup.appendChild(el('rect', { x: mx - lw / 2, y: my - 9, width: lw, height: 18, rx: '4', fill: '#09090b', stroke: isRisk ? '#f97316' : '#155e75', opacity: '0.95' }))
      relGroup.appendChild(el('text', { x: mx, y: my + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: isRisk ? '#fed7aa' : '#cffafe', 'font-size': '10', 'font-weight': '700' }, label))
    }
    svg.appendChild(relGroup)
  }

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    const pos = positions[i]
    const isOrg = entity.entity_type === 'organization'
    const r = isOrg ? 28 : 22
    const degree = degrees.get(entity.id) || 0
    const { fill, stroke } = graphHeat(degree / maxDeg, isOrg)

    const nodeGroup = el('g')
    nodeGroup.appendChild(el('title', {}, `${entity.name} (${degree})`))
    nodeGroup.appendChild(el('circle', { cx: pos.x, cy: pos.y, r, fill, stroke, 'stroke-width': '2' }))
    nodeGroup.appendChild(el('text', { x: pos.x, y: pos.y + 4, 'text-anchor': 'middle', fill: '#fff', 'font-size': '11', 'pointer-events': 'none' }, entity.name.slice(0, 7)))
    nodeGroup.appendChild(el('text', { x: pos.x, y: pos.y + r + 13, 'text-anchor': 'middle', fill: '#a1a1aa', 'font-size': '9', 'pointer-events': 'none' }, String(degree)))
    svg.appendChild(nodeGroup)
  }

  return svg
}

// ─── End of events tab ─────────────────────────────────────────────────────────

function bindActions() {
  byId('openHub').addEventListener('click', (event) => {
    trackPopupEvent('popup_action', 'open_hub')
    openTab(state.settings.tooltipOrigin)
  })
  byId('openDonate').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_donate')
    openTab(truthUrl('/donate'))
  })
  byId('openDonateCard').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_donate_card')
    openTab(truthUrl('/donate'))
  })
  byId('openLogin').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_login')
    openWindow(truthUrl('/login', { redirect: '/extension-auth-sync?close=1' }), 460, 720)
  })
  byId('resyncAuth').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'resync_auth')
    resyncAuth()
  })
  byId('resetProductionOrigins').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'reset_production_origins')
    resetProductionOrigins()
  })
  byId('signOut').addEventListener('click', () => {
    signOut()
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
    openWindow(truthUrl('/report-domain', reportParamsFromContext(context)), 540, 760)
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
  byId('openMobile').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_mobile')
    openTab(truthUrl('/mobile', { url: currentUrl() }))
  })
  byId('openProfile').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_profile')
    openTab(truthUrl('/profile'))
  })
  byId('repairReport').addEventListener('click', async () => {
    trackPopupEvent('popup_action', 'repair_report')
    const context = state.pageContext || await currentPageContext()
    openWindow(truthUrl('/report-domain', reportParamsFromContext(context)), 540, 760)
  })
  byId('repairShowBanner').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'repair_show_banner')
    reshowBanner()
  })
  byId('repairHealth').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'repair_health')
    openTab(truthUrl('/health'))
  })
  byId('repairGuide').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'repair_guide')
    openTab(truthUrl('/user-guide', { section: 'extension-settings' }) + '#extension-settings')
  })
  byId('openDemo').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_demo')
    openTab(truthUrl('/demo-news'))
  })
  byId('openGuide').addEventListener('click', () => {
    trackPopupEvent('popup_action', 'open_guide')
    openTab(truthUrl('/user-guide'))
  })
  byId('dismissOnboarding').addEventListener('click', () => {
    state.onboardingDismissed = true
    chrome.storage.local.set({ truthshield_onboarding_dismissed: true })
    updateOnboardingVisibility()
  })

  // Tab switching
  byId('tab-status').addEventListener('click', () => showMainTab('status'))
  byId('tab-events').addEventListener('click', () => {
    showMainTab('events')
    eventsState.query = ''
    byId('event-search-input').value = ''
    loadEvents()
  })

  // Events panel actions
  byId('events-create-btn').addEventListener('click', () => openCreateEvent())
  byId('events-refresh-btn').addEventListener('click', () => loadEvents())

  // Events search
  byId('event-search-btn').addEventListener('click', () => {
    eventsState.query = byId('event-search-input').value
    loadEvents()
  })
  byId('event-search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      eventsState.query = e.target.value
      loadEvents()
    }
  })

  // Event detail navigation
  byId('detail-back').addEventListener('click', () => showMainTab('events'))
  byId('detail-refresh-btn').addEventListener('click', async () => {
    const id = eventsState.selectedEventId
    delete eventsState.cache.timeline[id]
    delete eventsState.cache.graph[id]
    if (eventsState.activeDetailTab === 'timeline') await renderTimeline(id)
    else await renderGraph(id)
  })
  byId('detail-tab-timeline').addEventListener('click', async () => {
    showDetailTab('timeline')
    await renderTimeline(eventsState.selectedEventId)
  })
  byId('detail-tab-graph').addEventListener('click', async () => {
    showDetailTab('graph')
    await renderGraph(eventsState.selectedEventId)
  })
}

async function initPopup() {
  await window.truthShieldI18nReady

  if (!hasExtensionContext()) {
    state.settings = normalizedSettings(defaults)
    byId('version').textContent = 'web-preview'
    byId('currentUrl').textContent = window.location.href
    byId('domains').textContent = '-'
    byId('votes').textContent = '-'
    byId('apiStatus').textContent = '-'
    byId('authStatus').textContent = t('popupBadgeUnsupported')
    byId('authUser').textContent = selectedLocale() === 'zh-TW'
      ? '請從 Chrome 插件彈出視窗開啟'
      : 'Open this from the Chrome extension popup'
    byId('achievementCard').hidden = true
    setPageContextSummary('popupSummaryUnsupported', 'popupBadgeUnsupported', 'bad')
    setStatus(selectedLocale() === 'zh-TW'
      ? '這個頁面需要 Chrome 插件環境'
      : 'This page requires the Chrome extension context', true)
    document.querySelectorAll('button').forEach((button) => {
      button.disabled = true
    })
    return
  }

  chrome.storage.sync.get(defaults, async (settings) => {
    state.settings = normalizedSettings(settings)
    applyStaticEventLabels()
    state.tab = await activeTab()

    const url = currentUrl()
    byId('currentUrl').textContent = url || t('unavailableTab')
    const disabled = !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')
    byId('openStatus').disabled = disabled
    byId('openVote').disabled = disabled
    byId('openReport').disabled = disabled
    setPageContextSummary(disabled ? 'popupSummaryUnsupported' : 'popupSummaryDefault', disabled ? 'popupBadgeUnsupported' : 'popupBadgeChecking', disabled ? 'bad' : 'ok')
    setStatus(disabled ? t('unsupportedTab') : t('readyStatus'))
    renderOriginWarning()

    bindActions()
    chrome.storage.local.get({ truthshield_onboarding_dismissed: false }, (local) => {
      state.onboardingDismissed = Boolean(local.truthshield_onboarding_dismissed)
      updateOnboardingVisibility()
    })
    trackPopupEvent('popup_opened', 'popup')
    await loadPageDebug()
    await loadAuthSummary()
    await loadSummary()
  })
}

initPopup()
