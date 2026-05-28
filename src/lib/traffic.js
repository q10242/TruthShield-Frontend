import { API_BASE_URL } from './api'
import { currentLocale } from '../i18n'

async function sha256(value) {
  if (!value || !globalThis.crypto?.subtle) return undefined
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function trackEvent(eventType, payload = {}) {
  const event = {
    event_type: eventType,
    source: payload.source || 'web',
    feature: payload.feature,
    path: payload.path || window.location.pathname,
    domain: payload.domain || window.location.hostname,
    url_hash: payload.url ? await sha256(payload.url) : payload.url_hash,
    success: payload.success ?? true,
    cache_status: payload.cache_status,
    locale: currentLocale(),
    metadata: payload.metadata || {},
  }

  const body = JSON.stringify(event)
  const url = `${API_BASE_URL}/api/traffic/events`
  const blob = new Blob([body], { type: 'application/json' })

  const isSameOrigin = (() => {
    try {
      return new URL(url, window.location.href).origin === window.location.origin
    } catch {
      return false
    }
  })()

  if (isSameOrigin && navigator.sendBeacon?.(url, blob)) {
    return
  }

  fetch(url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-TruthShield-Client': 'web',
    },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function trackPageView(feature) {
  return trackEvent('page_view', { feature })
}
