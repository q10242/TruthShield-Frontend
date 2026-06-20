<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchBotProtectionConfig } from '../lib/api'

const mountPoint = ref(null)
let config = null
let scriptPromise = null
const widgets = new Set()

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(window.turnstile), { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile could not load.')), { once: true })
    document.head.appendChild(script)
  })

  return scriptPromise
}

async function runChallenge(action) {
  if (!config?.bot_protection_enabled || !config?.turnstile_enabled) return ''
  if (!config.turnstile_site_key) throw new Error('Security verification is not configured.')

  const turnstile = await loadTurnstile()
  return new Promise((resolve, reject) => {
    const container = document.createElement('div')
    mountPoint.value.appendChild(container)
    let widgetId = null
    const cleanup = () => {
      if (widgetId !== null) {
        turnstile.remove(widgetId)
        widgets.delete(widgetId)
      }
      container.remove()
    }

    widgetId = turnstile.render(container, {
      sitekey: config.turnstile_site_key,
      action: String(action || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32),
      size: 'invisible',
      execution: 'execute',
      callback(token) {
        cleanup()
        resolve(token)
      },
      'error-callback'() {
        cleanup()
        reject(new Error('Security verification failed.'))
      },
      'expired-callback'() {
        cleanup()
        reject(new Error('Security verification expired.'))
      },
    })
    widgets.add(widgetId)
    turnstile.execute(widgetId)
  })
}

async function handleMessage(event) {
  if (event.source !== window.parent || event.data?.type !== 'TRUTH_SHIELD_CHALLENGE_REQUEST') return
  const port = event.ports?.[0]
  if (!port) return

  try {
    const token = await runChallenge(String(event.data.action || ''))
    port.postMessage({ ok: true, requestId: event.data.requestId, token })
  } catch (error) {
    port.postMessage({ ok: false, requestId: event.data.requestId, message: error?.message || 'Security verification failed.' })
  } finally {
    port.close()
  }
}

onMounted(async () => {
  config = await fetchBotProtectionConfig().catch(() => ({ bot_protection_enabled: false, turnstile_enabled: false }))
  window.addEventListener('message', handleMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  if (window.turnstile) {
    for (const widgetId of widgets) window.turnstile.remove(widgetId)
  }
  widgets.clear()
})
</script>

<template>
  <main ref="mountPoint" class="h-px w-px overflow-hidden" aria-hidden="true"></main>
</template>
