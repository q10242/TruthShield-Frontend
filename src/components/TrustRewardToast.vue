<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchNotifications, markNotificationRead } from '../lib/api'

const TOKEN_KEY = 'truthshield_api_token'
const SEEN_KEY = 'truthshield_seen_reward_notifications'
const toast = ref(null)
const busy = ref(false)
let timer = null

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

async function dismiss() {
  const current = toast.value
  toast.value = null
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (token && current?.id) {
    await markNotificationRead(token, current.id).catch(() => null)
  }
}

onMounted(() => {
  poll()
  timer = window.setInterval(poll, 30000)
  window.addEventListener('focus', poll)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  window.removeEventListener('focus', poll)
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
          <button class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-emerald-300/50 hover:text-emerald-100" @click="dismiss">OK</button>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3">
          <p class="text-xs text-zinc-500">New trust score {{ rewardScore.toFixed(2) }}</p>
          <a v-if="toast.action_url" class="text-xs font-semibold text-emerald-200 hover:text-emerald-100" :href="toast.action_url" target="_blank" rel="noreferrer" @click="dismiss">
            Open
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>
