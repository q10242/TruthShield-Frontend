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
const sampleArticleUrl = 'https://www.cna.com.tw/news/aipl/202605160202.aspx'
const token = computed(() => localStorage.getItem(TOKEN_KEY) || '')
const zh = computed(() => currentLocale() === 'zh-TW')
const copy = computed(() => onboardingCopy[zh.value ? 'zh-TW' : 'en'])
const completedCount = computed(() => summary.value?.completed_steps?.length || 0)
const progressPercent = computed(() => Math.round((completedCount.value / ONBOARDING_REQUIRED_STEPS.length) * 100))
const nextStep = computed(() => summary.value?.remaining_steps?.[0] || '')
const nextStepCard = computed(() => steps.value.find((step) => step.key === nextStep.value))
const steps = computed(() => ONBOARDING_REQUIRED_STEPS.map((key) => ({
  key,
  ...copy.value[key],
  done: Boolean(summary.value?.completed_steps?.includes(key)),
  ...stepMeta(key),
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

function stepMeta(step) {
  const locale = zh.value ? 'zh-TW' : 'en'
  const votePanelTo = `/iframe-vote-panel?news_url=${encodeURIComponent(sampleArticleUrl)}&expanded=1&locale=${locale}`
  const map = {
    open_demo: {
      action: 'mark',
      actionLabel: zh.value ? '我知道接下來要做什麼' : 'I know what to do next',
      instruction: zh.value
        ? '先不要急著投票。你要做的是：在新聞頁看提示，打開面板，看共識與證據，讀完再決定要不要留下心情、投票或補證據。'
        : 'Do not start by voting. First see the banner on an article, open the panel, review consensus and evidence, then decide whether to react, vote, or add evidence.',
      fallbackTo: '/user-guide#extension',
      fallbackLabel: zh.value ? '看完整說明' : 'Read full guide',
    },
    install_extension: {
      to: '/extension-install',
      actionLabel: zh.value ? '確認安裝方式' : 'Check install steps',
      instruction: zh.value
        ? '如果已經安裝，請確認它有釘選在 Chrome 工具列，並且 popup 可以打開。'
        : 'If installed, confirm it is pinned in Chrome and the popup opens.',
      doneLabel: zh.value ? '我已裝好並能打開 popup' : 'Installed and popup works',
    },
    sync_auth: {
      to: token.value ? '/profile' : '/login?redirect=/onboarding',
      actionLabel: token.value ? (zh.value ? '查看個人頁' : 'Open profile') : (zh.value ? '登入 / 同步身份' : 'Sign in / sync identity'),
      instruction: zh.value
        ? '這一步是讓套件和官網使用同一個身份。之後投票、證據、徽章才會算在你的帳號。'
        : 'This lets the extension and website use the same identity so votes, evidence, and badges belong to your account.',
      doneLabel: zh.value ? '我已同步登入' : 'Sign-in synced',
    },
    see_article_banner: {
      href: sampleArticleUrl,
      actionLabel: zh.value ? '打開真實新聞範例' : 'Open a real article',
      instruction: zh.value
        ? '打開新聞後看頁面最上方是否出現 TruthShield bar。看到 bar，就代表插件已經進入實際閱讀流程。'
        : 'Open the article and look for the TruthShield top bar. Seeing it means the extension is active in the real reading flow.',
      doneLabel: zh.value ? '我已看到上方 bar' : 'I saw the top bar',
    },
    open_vote_panel: {
      to: votePanelTo,
      actionLabel: zh.value ? '先看面板長什麼樣' : 'Preview the panel',
      instruction: zh.value
        ? '正式使用時，請在新聞頁點上方 bar，或打開 extension popup 按「開啟投票與證據面板」。'
        : 'In normal use, click the top bar on a news article or open the extension popup and choose the voting and evidence panel.',
      doneLabel: zh.value ? '我已從 bar 或 popup 開過面板' : 'I opened it from the bar or popup',
    },
    open_event_context: {
      to: '/events/40?onboard=1',
      actionLabel: zh.value ? '看事件頁範例' : 'Open event example',
      instruction: zh.value
        ? '事件頁不是叫你看單篇新聞，而是把多篇報導整理成同一個事件的時間線、進度狀態與分類。'
        : 'Event pages are not single-article pages. They organize multiple reports into one timeline, status, and category context.',
      doneLabel: zh.value ? '我理解事件頁用途' : 'I understand event context',
    },
  }

  return map[step] || { to: '/', actionLabel: zh.value ? '前往' : 'Go', instruction: '' }
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
          <p class="text-sm font-semibold text-cyan-300">{{ zh ? '新手導覽' : 'Onboarding' }}</p>
          <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="text-3xl font-semibold text-white">{{ zh ? '第一次進來，先完成一個真實閱讀流程' : 'Start with one real reading flow' }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                {{ zh ? '目標很簡單：安裝插件，打開一篇真實新聞，看到上方 bar，打開面板，再理解事件頁。完成後給新手徽章，不增加信任分。' : 'The goal is simple: install the extension, open a real article, see the top bar, open the panel, then understand event context. Completion grants a starter badge, not trust score.' }}
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
        <div v-else class="grid gap-5 p-6">
          <section v-if="nextStepCard" class="rounded-lg border border-cyan-300/25 bg-cyan-300/[0.07] p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{{ zh ? '現在要做什麼' : 'What to do now' }}</p>
            <h2 class="mt-2 text-xl font-semibold text-white">{{ nextStepCard.title }}</h2>
            <p class="mt-2 text-sm leading-7 text-zinc-300">{{ nextStepCard.instruction }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button v-if="nextStepCard.action === 'mark'" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" type="button" @click="completeStep(nextStepCard.key)">
                {{ nextStepCard.actionLabel }}
              </button>
              <RouterLink v-else-if="nextStepCard.to" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" :to="nextStepCard.to">
                {{ nextStepCard.actionLabel }}
              </RouterLink>
              <a v-else-if="nextStepCard.href" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" :href="nextStepCard.href" target="_blank" rel="noopener noreferrer">
                {{ nextStepCard.actionLabel }}
              </a>
              <RouterLink v-if="nextStepCard.fallbackTo" class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" :to="nextStepCard.fallbackTo">
                {{ nextStepCard.fallbackLabel }}
              </RouterLink>
            </div>
          </section>

          <section class="grid gap-3 rounded-lg border border-white/10 bg-zinc-950/60 p-4 md:grid-cols-3">
            <div>
              <p class="text-sm font-semibold text-white">{{ zh ? '1. 在新聞頁看提示' : '1. See context on an article' }}</p>
              <p class="mt-1 text-xs leading-5 text-zinc-500">{{ zh ? '上方 bar 是主要入口，不是官網 demo。' : 'The top bar is the main entry, not a website demo.' }}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">{{ zh ? '2. 打開面板後再判斷' : '2. Open the panel before judging' }}</p>
              <p class="mt-1 text-xs leading-5 text-zinc-500">{{ zh ? '先看共識、心情與證據，再決定要不要投票。' : 'Review consensus, reactions, and evidence before voting.' }}</p>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">{{ zh ? '3. 事件頁看長期脈絡' : '3. Use events for long context' }}</p>
              <p class="mt-1 text-xs leading-5 text-zinc-500">{{ zh ? '單篇新聞不夠時，用事件整理前因後果。' : 'When one article is not enough, use events for the full timeline.' }}</p>
            </div>
          </section>

          <article
            v-for="(step, index) in steps"
            :key="step.key"
            class="grid gap-4 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_auto]"
            :class="step.done ? 'border-emerald-300/30 bg-emerald-300/10' : 'border-white/10 bg-zinc-950/70'"
          >
            <div class="flex min-w-0 gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold" :class="step.done ? 'border-emerald-300 text-emerald-100' : 'border-cyan-300/40 text-cyan-100'">
                {{ step.done ? '✓' : index + 1 }}
              </span>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-white">{{ step.title }}</h2>
                <p class="mt-1 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
                <p class="mt-2 text-xs leading-5 text-zinc-500">{{ step.instruction }}</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 md:justify-end">
              <button v-if="step.action === 'mark' && !step.done" class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" type="button" @click="completeStep(step.key)">
                {{ step.actionLabel }}
              </button>
              <RouterLink v-if="step.to" class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" :to="step.to">
                {{ step.done ? (zh ? '再看一次' : 'Review') : step.actionLabel }}
              </RouterLink>
              <a v-if="step.href" class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" :href="step.href" target="_blank" rel="noopener noreferrer">
                {{ step.done ? (zh ? '再打開' : 'Open again') : step.actionLabel }}
              </a>
              <button v-if="!step.done && step.action !== 'mark'" class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/60" type="button" @click="completeStep(step.key)">
                {{ step.doneLabel || (zh ? '我已完成' : 'Done') }}
              </button>
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

    </section>
  </main>
</template>
