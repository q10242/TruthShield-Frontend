import { currentLocale } from '../i18n'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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

export async function fetchNewsStatus(url) {
  return request(`/api/news/status?url=${encodeURIComponent(url)}&locale=${encodeURIComponent(currentLocale())}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchNewsEvidence(url) {
  const payload = await request(`/api/news/evidence?url=${encodeURIComponent(url)}&locale=${encodeURIComponent(currentLocale())}`, {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchTags() {
  const payload = await request(`/api/tags?locale=${encodeURIComponent(currentLocale())}`, {
    headers: { 'Content-Type': undefined },
  })

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
  const payload = await request(`/api/news/official-responses?url=${encodeURIComponent(url)}`, {
    headers: { 'Content-Type': undefined },
  })

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
  return request('/api/vote', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload(payload)),
  })
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

export async function reactToEvidence(token, voteId, helpful) {
  return request(`/api/evidence/${voteId}/reaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withChallengePayload({ helpful })),
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
  const payload = await request('/api/leaderboard/media', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
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
  return request('/api/transparency', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchAlgorithm() {
  return request('/api/algorithm', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchVisionReadiness() {
  return request('/api/vision-readiness', {
    headers: { 'Content-Type': undefined },
  })
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

export async function fetchEvents(params = {}) {
  const query = toQuery(params)
  return request(`/api/events${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': undefined },
  })
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
  return request('/api/extension/summary', {
    headers: { 'Content-Type': undefined },
  })
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
  const payload = await request('/api/evidence-report-reasons', {
    headers: { 'Content-Type': undefined },
  })

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
  const payload = await request('/api/youtube-channels', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchNewsDomainReportStatus(domainOrUrl) {
  const query = domainOrUrl.startsWith?.('http') ? `url=${encodeURIComponent(domainOrUrl)}` : `domain=${encodeURIComponent(domainOrUrl)}`
  return request(`/api/news-domain-reports/status?${query}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchTrustedEvidenceSources() {
  const payload = await request('/api/trusted-evidence-sources', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchRateLimitPolicies() {
  const payload = await request('/api/rate-limit-policies', {
    headers: { 'Content-Type': undefined },
  })

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
  return request('/api/donations/summary', {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchDonationSupporters() {
  const payload = await request('/api/donations/supporters', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchDonationMonthly() {
  const payload = await request('/api/donations/monthly', {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchDonationConfig() {
  return request('/api/donations/config', {
    headers: { 'Content-Type': undefined },
  })
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
