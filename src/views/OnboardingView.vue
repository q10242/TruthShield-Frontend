<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { currentLocale } from '../i18n'
import {
  loadOnboarding,
  markOnboardingStep,
  onboardingCopy,
  ONBOARDING_REQUIRED_STEPS,
} from '../lib/onboarding'
import { trackPageView } from '../lib/traffic'

const TOKEN_KEY = 'truthshield_api_token'
const route = useRoute()
const summary = ref(null)
const loading = ref(true)
const message = ref('')
const token = computed(() => localStorage.getItem(TOKEN_KEY) || '')
const zh = computed(() => currentLocale() === 'zh-TW')
const copy = computed(() => onboardingCopy[zh.value ? 'zh-TW' : 'en'])
const completedCount = computed(() => summary.value?.completed_steps?.length || 0)
const progressPercent = computed(() => Math.round((completedCount.value / ONBOARDING_REQUIRED_STEPS.length) * 100))
const nextStep = computed(() => summary.value?.remaining_steps?.[0] || '')
const steps = computed(() => ONBOARDING_REQUIRED_STEPS.map((key) => ({
  key,
  ...copy.value[key],
  done: Boolean(summary.value?.completed_steps?.includes(key)),
  to: stepTarget(key),
})))

async function refresh() {
  loading.value = true
  try {
    summary.value = await loadOnboarding(token.value)
  } finally {
    loading.value = false
  }
}

async function completeStep(step) {
  summary.value = await markOnboardingStep(step, token.value)
  message.value = zh.value ? '進度已更新。' : 'Progress updated.'
}

function stepTarget(step) {
  if (step === 'open_demo') return '/demo-news?onboard=1'
  if (step === 'install_extension') return '/extension-install'
  if (step === 'sync_auth') return token.value ? '/profile' : '/login?redirect=/onboarding'
  if (step === 'see_article_banner') return '/demo-news?onboard=1#truthshield-demo-banner'
  if (step === 'open_vote_panel') return '/demo-news?onboard=1#truthshield-demo-panel'
  if (step === 'open_event_context') return '/events/40?onboard=1'

  return '/'
}

onMounted(async () => {
  trackPageView('onboarding')
  if (route.query.source === 'extension') {
    await markOnboardingStep('install_extension', token.value).catch(() => null)
  }
  if (token.value) {
    await markOnboardingStep('sync_auth', token.value).catch(() => null)
  }
  await refresh()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <AppNav>
        <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/user-guide">
          {{ zh ? '使用手冊' : 'User guide' }}
        </RouterLink>
      </AppNav>

      <section class="mt-8 overflow-hidden rounded-lg border border-cyan-300/20 bg-white/[0.03]">
        <div class="border-b border-white/10 bg-cyan-300/[0.04] p-6">
          <p class="text-sm font-semibold text-cyan-300">{{ zh ? '新手任務' : 'Onboarding missions' }}</p>
          <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="text-3xl font-semibold text-white">{{ zh ? '第一次使用 TruthShield，照這條路走' : 'Start using TruthShield with a guided path' }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                {{ zh ? '完成這六步後，你會理解插件、投票、證據與事件脈絡如何串在一起。完成後會得到新手完成徽章，但不會增加信任分。' : 'Complete these six steps to understand the extension, voting, evidence, and event context. Completion grants a starter badge but does not change trust score.' }}
              </p>
            </div>
            <div class="min-w-40 rounded-md border border-white/10 bg-zinc-950/80 p-4">
              <p class="text-xs text-zinc-500">{{ zh ? '完成進度' : 'Progress' }}</p>
              <p class="mt-1 text-3xl font-semibold text-white">{{ completedCount }} / {{ ONBOARDING_REQUIRED_STEPS.length }}</p>
            </div>
          </div>
          <div class="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-cyan-300 transition-all" :style="{ width: `${progressPercent}%` }"></div>
          </div>
        </div>

        <div v-if="loading" class="p-6 text-sm text-zinc-400">{{ zh ? '讀取中...' : 'Loading...' }}</div>
        <div v-else class="grid gap-3 p-6">
          <article
            v-for="(step, index) in steps"
            :key="step.key"
            class="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            :class="step.done ? 'border-emerald-300/30 bg-emerald-300/10' : 'border-white/10 bg-zinc-950/70'"
          >
            <div class="flex min-w-0 gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold" :class="step.done ? 'border-emerald-300 text-emerald-100' : 'border-cyan-300/40 text-cyan-100'">
                {{ step.done ? '✓' : index + 1 }}
              </span>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-white">{{ step.title }}</h2>
                <p class="mt-1 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button v-if="!step.done" class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/60" @click="completeStep(step.key)">
                {{ zh ? '手動標記' : 'Mark done' }}
              </button>
              <RouterLink class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" :to="step.to">
                {{ step.done ? (zh ? '再看一次' : 'Review') : (zh ? '前往' : 'Go') }}
              </RouterLink>
            </div>
          </article>
        </div>
      </section>

      <p v-if="message" class="mt-3 rounded-md border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">{{ message }}</p>

      <section v-if="summary?.completed" class="mt-6 rounded-lg border border-amber-300/30 bg-amber-300/10 p-5">
        <p class="text-sm font-semibold text-amber-100">{{ zh ? '新手任務完成' : 'Onboarding complete' }}</p>
        <p class="mt-2 text-sm leading-6 text-amber-100/80">
          {{ zh ? '新手完成徽章已加入你的個人頁。接下來可以從新聞搜尋、社群任務或事件頁開始貢獻。' : 'Your starter badge is on your profile. Continue with news search, community tasks, or event pages.' }}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink class="rounded-md bg-amber-200 px-3 py-2 text-sm font-semibold text-zinc-950" to="/profile">{{ zh ? '查看個人頁' : 'Open profile' }}</RouterLink>
          <RouterLink class="rounded-md border border-amber-200/40 px-3 py-2 text-sm font-semibold text-amber-100" to="/community-tasks">{{ zh ? '社群任務' : 'Community tasks' }}</RouterLink>
        </div>
      </section>

      <section v-else-if="nextStep" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <p class="text-sm font-semibold text-cyan-100">{{ zh ? '下一步' : 'Next step' }}</p>
        <p class="mt-2 text-sm text-zinc-400">{{ copy[nextStep]?.title }}</p>
        <RouterLink class="mt-4 inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" :to="stepTarget(nextStep)">
          {{ zh ? '繼續導覽' : 'Continue' }}
        </RouterLink>
      </section>
    </section>
  </main>
</template>
