import { fetchBotProtectionConfig } from './api'

let configPromise = null
let framePromise = null

function botConfig() {
  configPromise ||= fetchBotProtectionConfig().catch(() => ({
    bot_protection_enabled: false,
    turnstile_enabled: false,
    protected_actions: [],
  }))
  return configPromise
}

function challengeFrame() {
  if (framePromise) return framePromise

  framePromise = new Promise((resolve, reject) => {
    const frame = document.createElement('iframe')
    frame.title = 'TruthShield security verification'
    frame.src = `${window.location.origin}/iframe-challenge`
    frame.setAttribute('aria-hidden', 'true')
    frame.style.position = 'fixed'
    frame.style.width = '1px'
    frame.style.height = '1px'
    frame.style.left = '-10000px'
    frame.style.top = '-10000px'
    frame.style.border = '0'
    frame.style.opacity = '0'
    frame.style.pointerEvents = 'none'
    frame.addEventListener('load', () => resolve(frame), { once: true })
    frame.addEventListener('error', () => reject(new Error('Security verification could not load.')), { once: true })
    document.documentElement.appendChild(frame)
  })

  return framePromise
}

export async function requestBotChallenge(action) {
  const config = await botConfig()
  if (!config.bot_protection_enabled || !config.turnstile_enabled || !config.protected_actions?.includes(action)) {
    return ''
  }

  const frame = await challengeFrame()
  const channel = new MessageChannel()
  const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      channel.port1.close()
      reject(new Error('Security verification timed out.'))
    }, 10000)

    channel.port1.onmessage = (event) => {
      if (event.data?.requestId !== requestId) return
      window.clearTimeout(timeout)
      channel.port1.close()
      if (event.data?.ok && event.data.token) {
        resolve(event.data.token)
      } else {
        reject(new Error(event.data?.message || 'Security verification failed.'))
      }
    }
    channel.port1.start()
    frame.contentWindow.postMessage({
      type: 'TRUTH_SHIELD_CHALLENGE_REQUEST',
      requestId,
      action,
    }, window.location.origin, [channel.port2])
  })
}

export async function submitWithBotChallenge(action, submit) {
  const token = await requestBotChallenge(action)
  try {
    return await submit(token, false)
  } catch (error) {
    if (error?.status !== 428 || !error?.payload?.bot_protection?.retryable) throw error
    const retryToken = await requestBotChallenge(action)
    return submit(retryToken, true)
  }
}
