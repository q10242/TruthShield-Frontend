<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchNotifications, markNotificationRead } from '../lib/api'
import { useI18n } from '../i18n'

const { t } = useI18n()

const TOKEN_KEY = 'truthshield_api_token'
const SEEN_KEY = 'truthshield_seen_reward_notifications'
const LAST_POLL_KEY = 'truthshield_last_reward_notification_poll_at'
const POLL_INTERVAL_MS = 5 * 60 * 1000
const FOCUS_POLL_MIN_INTERVAL_MS = 2 * 60 * 1000
const toast = ref(null)
const busy = ref(false)
let timer = null
let focusHandler = null

const rewardDelta = computed(() => Number(toast.value?.metadata?.delta || 0))
const rewardScore = computed(() => Number(toast.value?.metadata?.new_score || 0))

function seenIds() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function rememberSeen(id) {
  const ids = seenIds()
  ids.add(id)
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-100)))
}

function rewardNotification(items = []) {
  const seen = seenIds()
  return items.find((item) => {
    const delta = Number(item?.metadata?.delta || 0)
    return item && !item.read_at && item.type === 'trust.adjusted' && delta > 0 && !seen.has(item.id)
  })
}

async function poll() {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token || busy.value || toast.value) return

  busy.value = true
  try {
    const payload = await fetchNotifications(token)
    const reward = rewardNotification(payload.data || [])
    if (reward) {
      toast.value = reward
      rememberSeen(reward.id)
    }
  } catch (err) {
    if (err.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
    }
  } finally {
    busy.value = false
  }
}

function lastPollAt() {
  return Number(sessionStorage.getItem(LAST_POLL_KEY) || 0)
}

function rememberPoll() {
  sessionStorage.setItem(LAST_POLL_KEY, String(Date.now()))
}

function pollIfStale(minInterval = POLL_INTERVAL_MS) {
  if (Date.now() - lastPollAt() < minInterval) return
  if (!localStorage.getItem(TOKEN_KEY)) return
  rememberPoll()
  poll()
}

async function dismiss() {
  const current = toast.value
  toast.value = null
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (token && current?.id) {
    await markNotificationRead(token, current.id).catch(() => null)
  }
}

onMounted(() => {
  pollIfStale(0)
  timer = window.setInterval(() => pollIfStale(POLL_INTERVAL_MS), POLL_INTERVAL_MS)
  focusHandler = () => pollIfStale(FOCUS_POLL_MIN_INTERVAL_MS)
  window.addEventListener('focus', focusHandler)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  if (focusHandler) window.removeEventListener('focus', focusHandler)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-3 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-2 opacity-0 scale-95"
  >
    <div v-if="toast" class="fixed right-4 top-16 z-[2147483000] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-emerald-300/40 bg-zinc-950 shadow-2xl shadow-emerald-950/40">
      <div class="bg-emerald-300 px-4 py-2 text-xs font-semibold text-zinc-950">
        Trust +{{ rewardDelta.toFixed(2) }}
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-white">{{ toast.title }}</p>
            <p class="mt-1 text-sm leading-6 text-zinc-300">{{ toast.body }}</p>
          </div>
          <button class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-emerald-300/50 hover:text-emerald-100" @click="dismiss">{{ t('common.dismiss') }}</button>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3">
          <p class="text-xs text-zinc-500">{{ t('common.newTrustScore') }} {{ rewardScore.toFixed(2) }}</p>
          <a v-if="toast.action_url" class="text-xs font-semibold text-emerald-200 hover:text-emerald-100" :href="toast.action_url" target="_blank" rel="noreferrer" @click="dismiss">
            {{ t('common.open') }}
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>
