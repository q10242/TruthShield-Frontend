<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { currentLocale } from '../i18n'
import { dismissOnboardingSurface, loadOnboarding } from '../lib/onboarding'

const TOKEN_KEY = 'truthshield_api_token'
const route = useRoute()
const visible = ref(false)
const summary = ref(null)
const token = computed(() => localStorage.getItem(TOKEN_KEY) || '')
const zh = computed(() => currentLocale() === 'zh-TW')
const excluded = computed(() => {
  const name = String(route.name || '')
  return name.startsWith('iframe-') || ['onboarding', 'login', 'extension-auth-sync'].includes(name)
})

async function refresh() {
  if (excluded.value) {
    visible.value = false
    return
  }
  summary.value = await loadOnboarding(token.value).catch(() => null)
  visible.value = Boolean(summary.value && !summary.value.completed && !summary.value.dismissed_surfaces?.includes('site_modal'))
}

async function dismiss() {
  summary.value = await dismissOnboardingSurface('site_modal', token.value).catch(() => summary.value)
  visible.value = false
}

onMounted(refresh)
watch(() => route.fullPath, refresh)
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[2147482500] grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
    <section class="w-full max-w-lg rounded-lg border border-cyan-300/25 bg-zinc-950 p-5 shadow-2xl shadow-black/60">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-cyan-300">{{ zh ? '第一次來 TruthShield？' : 'First time using TruthShield?' }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ zh ? '用六個任務快速看懂整套流程' : 'Learn the full workflow in six missions' }}</h2>
        </div>
        <button class="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:border-cyan-300/60 hover:text-cyan-100" @click="dismiss">
          {{ zh ? '關閉' : 'Close' }}
        </button>
      </div>
      <p class="mt-3 text-sm leading-7 text-zinc-400">
        {{ zh ? '導覽會帶你看互動示範、安裝插件、同步登入、看到新聞 bar、打開投票面板，最後理解事件時間線與關係圖。' : 'The guide walks through the demo, extension install, sign-in sync, article banner, voting panel, and event context.' }}
      </p>
      <div class="mt-5 grid gap-2 sm:grid-cols-2">
        <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-zinc-950" to="/onboarding" @click="visible = false">
          {{ zh ? '開始新手任務' : 'Start onboarding' }}
        </RouterLink>
        <button class="rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-cyan-300/60" @click="dismiss">
          {{ zh ? '我自己探索' : 'Explore myself' }}
        </button>
      </div>
    </section>
  </div>
</template>
