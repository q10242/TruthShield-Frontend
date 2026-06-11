import { currentLocale } from '../i18n'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const PUBLIC_READ_CACHE_PREFIX = 'truthshield_public_read_cache_v1:'
const SHORT_PUBLIC_CACHE_TTL_MS = 60 * 1000
const STATIC_PUBLIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000

export { API_BASE_URL }

async function request(path, options = {}) {
  const { headers: optionHeaders, ...fetchOptions } = options
  const headers = {
    Accept: 'application/json',
    'Accept-Language': currentLocale(),
    'Content-Type': 'application/json',
    ...(optionHeaders || {}),
  }

  Object.keys(headers).forEach((key) => {
    if (headers[key] === undefined) {
      delete headers[key]
    }
  })

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message || `API 回應狀態 ${response.status}`)
    error.status = response.status
    error.errors = data?.errors || {}
    error.payload = data || {}
    throw error
  }

  return data
}

async function cachedRequest(path, options = {}, ttlMs = SHORT_PUBLIC_CACHE_TTL_MS) {
  const headers = options.headers || {}
  if (headers.Authorization || headers.authorization || options.cache === 'no-store') {
    return request(path, options)
  }

  const key = publicReadCacheKey(path)
  const cached = readPublicReadCache(key)
  if (cached && Date.now() - Number(cached.cachedAt || 0) < ttlMs) {
    return cached.payload
  }

  const payload = await request(path, options)
  writePublicReadCache(key, payload)
  return payload
}

function publicReadCacheKey(path) {
  return `${PUBLIC_READ_CACHE_PREFIX}${API_BASE_URL}${path}`
}

function readPublicReadCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writePublicReadCache(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify({ cachedAt: Date.now(), payload }))
  } catch {
    // Browser-side cache is an optimization; ignore quota/private-mode failures.
  }
}

function forgetPublicReadCacheForUrl(url) {
  const target = String(url || '')
  if (!target) return

  const encoded = encodeURIComponent(target)
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key?.startsWith(PUBLIC_READ_CACHE_PREFIX) && (key.includes(encoded) || key.includes(target))) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // Cache invalidation must not block user actions.
  }
}

export function botChallengeToken() {
  return localStorage.getItem('truthshield_challenge_token') || undefined
}

function withChallengePayload(payload = {}) {
  const challengeToken = botChallengeToken()

  return challengeToken
    ? { ...payload, challenge_token: challengeToken }
    : payload
}

export async function fetchBotProtectionConfig() {
  return request('/api/bot/config', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchNewsStatus(url, options = {}) {
  const fresh = options.fresh ? `&fresh=${Date.now()}` : ''

  const path = `/api/news/status?url=${encodeURIComponent(url)}&locale=${encodeURIComponent(currentLocale())}${fresh}`

  return cachedRequest(path, {
    cache: options.fresh ? 'no-store' : undefined,
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function fetchReactionSummary(params = {}, token = '') {
  const query = toQuery(params)

  const path = `/api/reactions/summary${query ? `?${query}` : ''}`

  return cachedRequest(path, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': undefined,
    },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function submitReaderReaction(token, payload) {
  const response = await request('/api/reactions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  forgetPublicReadCacheForUrl(payload?.news_url)
  return response
}

export async function fetchNewsEvidence(url) {
  const payload = await cachedRequest(`/api/news/evidence?url=${encodeURIComponent(url)}&locale=${encodeURIComponent(currentLocale())}`, {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function fetchTags() {
  const payload = await cachedRequest(`/api/tags?locale=${encodeURIComponent(currentLocale())}`, {
    headers: { 'Content-Type': undefined },
  }, STATIC_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function fetchCurrentUser(token) {
  return request('/api/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function fetchProfile(token) {
  return request('/api/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function fetchOnboarding(token) {
  return request('/api/me/onboarding', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function updateOnboarding(token, payload) {
  return request('/api/me/onboarding', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateProfile(token, payload) {
  return request('/api/me/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function createClaimant(token, payload) {
  return request('/api/me/claimants', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchOfficialResponses(url) {
  const payload = await cachedRequest(`/api/news/official-responses?url=${encodeURIComponent(url)}`, {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function createOfficialResponse(token, payload) {
  return request('/api/official-responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function reactToOfficialResponse(token, responseId, helpful) {
  return request(`/api/official-responses/${encodeURIComponent(responseId)}/reaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ helpful }),
  })
}

export async function fetchMyDataExport(token) {
  return request('/api/me/export', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function fetchNotifications(token) {
  return request('/api/me/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function markAllNotificationsRead(token) {
  return request('/api/me/notifications/read-all', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function markNotificationRead(token, id) {
  return request(`/api/me/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function logout(token) {
  return request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function devLogin(payload) {
  return request('/api/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function oauthCallback(provider, payload) {
  return request(`/api/auth/${encodeURIComponent(provider)}/callback`, {
    method: 'POST',
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function createVote(token, payload) {
  const response = await request('/api/vote', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload(payload)),
  })
  forgetPublicReadCacheForUrl(payload?.url)
  return response
}

export async function recordReadSession(token, payload) {
  return request('/api/news/read-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function recordNewsSnapshot(payload) {
  return request('/api/news/snapshot', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function reportNewsChange(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/news/change-reports', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(payload),
  })
}

export async function reportJournalistMatch(matchId, payload = {}) {
  return request(`/api/news/journalist-matches/${encodeURIComponent(matchId)}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function reactToEvidence(token, voteId, helpful, verdict = {}) {
  return request(`/api/evidence/${voteId}/reaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload({ helpful, ...verdict })),
  })
}

export async function fetchMyVote(token, url) {
  return request(`/api/me/vote?url=${encodeURIComponent(url)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function reportEvidence(token, voteId, payload) {
  return request(`/api/evidence/${voteId}/report`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function fetchMediaLeaderboard() {
  const payload = await cachedRequest('/api/leaderboard/media', {
    headers: { 'Content-Type': undefined },
  }, 5 * 60 * 1000)

  return payload.data || []
}

export async function fetchMediaOutlets(params = {}) {
  const query = toQuery(params)
  return request(`/api/media-outlets${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchMediaOutletStats(id) {
  const payload = await request(`/api/media-outlets/${encodeURIComponent(id)}/stats`, {
    headers: { 'Content-Type': undefined },
  })

  return { ...(payload.data || {}), media: payload.media || null }
}

export async function fetchJournalists(params = {}) {
  const query = toQuery(params)
  return request(`/api/journalists${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchJournalist(id) {
  return request(`/api/journalists/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': undefined },
  })
}

function toQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  return query.toString()
}

export async function fetchEvidenceLibrary(params = {}) {
  const query = toQuery(params)
  const payload = await request(`/api/evidence-library${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })

  return payload
}

export async function fetchTransparency() {
  return cachedRequest('/api/transparency', {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function fetchPublicCommunityMetrics() {
  return cachedRequest('/api/public/community-metrics', {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function fetchAlgorithm() {
  return cachedRequest('/api/algorithm', {
    headers: { 'Content-Type': undefined },
  }, 10 * 60 * 1000)
}

export async function fetchVisionReadiness() {
  return cachedRequest('/api/vision-readiness', {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function fetchCommunityTasks(params = {}) {
  const query = toQuery(params)
  return request(`/api/community/tasks${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchCommunityTaskStats() {
  return request('/api/community/tasks/stats', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchCommunityTask(id) {
  return request(`/api/community/tasks/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function createCommunityTask(token, payload) {
  return request('/api/community/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function fetchEvents(params = {}) {
  const query = toQuery(params)
  return request(`/api/events${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchEventOptions() {
  return cachedRequest('/api/events/options', {
    headers: { 'Content-Type': undefined },
  }, STATIC_PUBLIC_CACHE_TTL_MS)
}

export async function createEvent(token, payload) {
  return request('/api/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateEvent(token, id, payload) {
  return request(`/api/events/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchEvent(id) {
  return request(`/api/events/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchEventTimeline(id) {
  const payload = await request(`/api/events/${encodeURIComponent(id)}/timeline`, {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function createEventTimelineEntry(token, id, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/timeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateEventTimelineEntry(token, id, entryId, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/timeline/${encodeURIComponent(entryId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteEventTimelineEntry(token, id, entryId) {
  return request(`/api/events/${encodeURIComponent(id)}/timeline/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchEventGraph(id) {
  return request(`/api/events/${encodeURIComponent(id)}/graph`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function searchGlobalEntities(params = {}) {
  const query = toQuery(params)
  return request(`/api/global-entities${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function createGlobalEntity(token, payload) {
  return request('/api/global-entities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export async function fetchGlobalEntity(id) {
  return request(`/api/global-entities/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function createEventEntity(token, id, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/entities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateEventEntity(token, id, entityId, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/entities/${encodeURIComponent(entityId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateEventEntityPosition(token, id, entityId, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/entities/${encodeURIComponent(entityId)}/position`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteEventEntity(token, id, entityId) {
  return request(`/api/events/${encodeURIComponent(id)}/entities/${encodeURIComponent(entityId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function mergeEventEntity(token, id, entityId, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/entities/${encodeURIComponent(entityId)}/merge`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function createEventRelationship(token, id, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/relationships`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateEventRelationship(token, id, relationshipId, payload) {
  return request(`/api/events/${encodeURIComponent(id)}/relationships/${encodeURIComponent(relationshipId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteEventRelationship(token, id, relationshipId) {
  return request(`/api/events/${encodeURIComponent(id)}/relationships/${encodeURIComponent(relationshipId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchEventEditLogs(id) {
  const payload = await request(`/api/events/${encodeURIComponent(id)}/edit-logs`, {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function sendCommunityTaskSignal(token, id, payload) {
  return request(`/api/community/tasks/${encodeURIComponent(id)}/signal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function fetchApiDocs() {
  return request('/api/docs', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchTrustLeaderboard() {
  const payload = await request('/api/leaderboard/trust', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchNewsDetail(id) {
  return request(`/api/news/by-id/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchExtensionSummary() {
  return cachedRequest('/api/extension/summary', {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function fetchExtensionCoverage() {
  const payload = await request('/api/extension/coverage', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchModerationEvents() {
  const payload = await request('/api/moderation-events', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchMyAppeals(token) {
  const payload = await request('/api/me/appeals', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })

  return payload.data || []
}

export async function createAppeal(token, payload) {
  return request('/api/me/appeals', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchNewsSearch(params = {}) {
  const query = typeof params === 'string' ? toQuery({ q: params }) : toQuery(params)
  const payload = await request(`/api/news/search${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })

  return payload
}

export async function fetchMediaOutlet(slug) {
  return request(`/api/media/${encodeURIComponent(slug)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchSystemHealth() {
  return request('/api/system/health', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchAccountGraphSummary(token) {
  return request('/api/account-graph/summary', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })
}

export async function fetchApiClients(token) {
  const payload = await request('/api/me/api-clients', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': undefined,
    },
  })

  return payload.data || []
}

export async function createApiClient(token, payload) {
  return request('/api/me/api-clients', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function revokeApiClient(token, clientId) {
  return request(`/api/me/api-clients/${encodeURIComponent(clientId)}/revoke`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchEvidenceReportReasons() {
  const payload = await cachedRequest('/api/evidence-report-reasons', {
    headers: { 'Content-Type': undefined },
  }, STATIC_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function reportNewsDomain(payload) {
  return request('/api/news-domain-reports', {
    method: 'POST',
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function reportUrlClassification(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/url-classification-reports', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function suggestTrustedSource(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/trusted-source-suggestions', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function reportYoutubeChannel(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/youtube-channel-reports', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function fetchYoutubeChannelReportStatus(channelUrl) {
  return request(`/api/youtube-channel-reports/status?channel_url=${encodeURIComponent(channelUrl)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchYoutubeChannels() {
  const payload = await cachedRequest('/api/youtube-channels', {
    headers: { 'Content-Type': undefined },
  }, STATIC_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function fetchNewsDomainReportStatus(domainOrUrl) {
  const query = domainOrUrl.startsWith?.('http') ? `url=${encodeURIComponent(domainOrUrl)}` : `domain=${encodeURIComponent(domainOrUrl)}`
  return request(`/api/news-domain-reports/status?${query}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchTrustedEvidenceSources() {
  const payload = await cachedRequest('/api/trusted-evidence-sources', {
    headers: { 'Content-Type': undefined },
  }, STATIC_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function fetchRateLimitPolicies() {
  const payload = await cachedRequest('/api/rate-limit-policies', {
    headers: { 'Content-Type': undefined },
  }, STATIC_PUBLIC_CACHE_TTL_MS)

  return payload.data || []
}

export async function fetchSelectorChecks() {
  return request('/api/extension/selector-checks', {
    headers: { 'Content-Type': undefined },
  })
}

export async function beginOauth(provider, payload = {}) {
  return request(`/api/auth/${encodeURIComponent(provider)}/begin`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function linkIdentity(token, provider, payload) {
  return request(`/api/auth/${encodeURIComponent(provider)}/link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function hideEvidence(token, evidenceId, reason) {
  return request(`/api/admin/evidences/${encodeURIComponent(evidenceId)}/hide`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  })
}

export async function restoreEvidence(token, evidenceId, reason) {
  return request(`/api/admin/evidences/${encodeURIComponent(evidenceId)}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  })
}

export async function createDonation(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/donations/ecpay', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({
      locale: currentLocale(),
      ...payload,
    }),
  })
}

export async function fetchDonation(tradeNo) {
  return request(`/api/donations/${encodeURIComponent(tradeNo)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchDonationSummary() {
  return cachedRequest('/api/donations/summary', {
    headers: { 'Content-Type': undefined },
  }, SHORT_PUBLIC_CACHE_TTL_MS)
}

export async function fetchDonationSupporters() {
  const payload = await cachedRequest('/api/donations/supporters', {
    headers: { 'Content-Type': undefined },
  }, 5 * 60 * 1000)

  return payload.data || []
}

export async function fetchDonationMonthly() {
  const payload = await cachedRequest('/api/donations/monthly', {
    headers: { 'Content-Type': undefined },
  }, 5 * 60 * 1000)

  return payload.data || []
}

export async function fetchDonationConfig() {
  return cachedRequest('/api/donations/config', {
    headers: { 'Content-Type': undefined },
  }, 10 * 60 * 1000)
}

export async function createUserDataRequest(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/user-data-requests', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(withChallengePayload(payload)),
  })
}

export async function createBugReport(payload) {
  const token = localStorage.getItem('truthshield_api_token')

  return request('/api/bug-reports', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(withChallengePayload(payload)),
  })
}
