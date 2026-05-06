const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export { API_BASE_URL }

async function request(path, options = {}) {
  const { headers: optionHeaders, ...fetchOptions } = options
  const headers = {
    Accept: 'application/json',
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
    const error = new Error(data?.message || `API responded with ${response.status}`)
    error.status = response.status
    error.errors = data?.errors || {}
    error.payload = data || {}
    throw error
  }

  return data
}

export async function fetchNewsStatus(url) {
  return request(`/api/news/status?url=${encodeURIComponent(url)}`, {
    headers: { 'Content-Type': undefined },
  })
}

export async function fetchNewsEvidence(url) {
  const payload = await request(`/api/news/evidence?url=${encodeURIComponent(url)}`, {
    headers: { 'Content-Type': undefined },
  })

  return payload.data || []
}

export async function fetchTags() {
  const payload = await request('/api/tags', {
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
    body: JSON.stringify(payload),
  })
}

export async function oauthCallback(provider, payload) {
  return request(`/api/auth/${encodeURIComponent(provider)}/callback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createVote(token, payload) {
  return request('/api/vote', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
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

export async function reactToEvidence(token, voteId, helpful) {
  return request(`/api/evidence/${voteId}/reaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ helpful }),
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
    body: JSON.stringify(payload),
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
    body: JSON.stringify(payload),
  })
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
