<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsStatus } from '../lib/api'
import { useI18n } from '../i18n'

const route = useRoute()
const loading = ref(true)
const statusLoading = ref(true)
const error = ref('')
const status = ref(null)
const { t } = useI18n()

const newsUrl = computed(() => route.query.news_url || '')

const toneClass = computed(() => {
  const tone = status.value?.tone

  if (tone === 'danger') {
    return 'border-red-400/50 bg-red-500/15 text-red-100'
  }

  if (tone === 'positive') {
    return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
  }

  if (tone === 'warning') {
    return 'border-orange-400/50 bg-orange-500/15 text-orange-100'
  }

  return 'border-white/10 bg-white/[0.04] text-zinc-200'
})

function notifyHeight() {
  nextTick(() => {
    window.parent?.postMessage(
      {
        type: 'TRUTH_SHIELD_TOOLTIP_RESIZE',
        height: document.documentElement.scrollHeight,
      },
      '*',
    )
  })
}

async function loadData() {
  error.value = ''
  statusLoading.value = true

  try {
    if (!newsUrl.value) {
      throw new Error('Missing news_url')
    }

    const statusPayload = await fetchNewsStatus(newsUrl.value)
    status.value = statusPayload
  } catch (err) {
    error.value = err.message || t('votePanel.unavailable')
  } finally {
    loading.value = false
    statusLoading.value = false
    notifyHeight()
  }
}

onMounted(async () => {
  await loadData()
  notifyHeight()
})
</script>

<template>
  <main class="min-w-[340px] bg-transparent p-3 text-zinc-100">
    <section class="rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/30">
      <div class="mb-3 flex items-center justify-between gap-4">
        <span class="text-xs font-semibold text-cyan-300">TruthShield</span>
        <span class="text-xs text-zinc-500">{{ statusLoading ? t('remaining.tooltipChecking') : t('remaining.tooltipLive') }}</span>
      </div>

      <div class="w-full rounded-md border p-3 text-left" :class="toneClass">
        <div v-if="statusLoading" class="text-sm text-zinc-300">{{ t('remaining.checkingLink') }}</div>
        <div v-else-if="error" class="text-sm text-orange-100">{{ t('remaining.tagUnavailable') }}</div>
        <div v-else class="space-y-1">
          <div class="text-sm font-semibold">{{ status?.display_text || t('votePanel.noData') }}</div>
          <div class="text-xs opacity-80">{{ t('remaining.readArticleToVote') }}</div>
        </div>
      </div>
    </section>
  </main>
</template>
