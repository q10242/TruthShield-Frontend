<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsStatus, fetchReactionSummary } from '../lib/api'
import { trackEvent } from '../lib/traffic'
import { useI18n } from '../i18n'

const route = useRoute()
const loading = ref(true)
const statusLoading = ref(true)
const error = ref('')
const status = ref(null)
const reactionSummary = ref(null)
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

const hoverReactions = computed(() => reactionSummary.value?.hover_reactions || [])

function reactionTitle(row) {
  if (!row) return ''
  return `${row.label || row.key} · ${t(`votePanel.reactionStrength.${row.strength || 'new'}`)} · ${row.count}`
}

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

    const [statusPayload, reactionsPayload] = await Promise.all([
      fetchNewsStatus(newsUrl.value),
      fetchReactionSummary({ news_url: newsUrl.value }).catch(() => null),
    ])
    status.value = statusPayload
    reactionSummary.value = reactionsPayload
    trackEvent('tooltip_status_loaded', {
      source: 'extension',
      feature: 'tooltip',
      url: newsUrl.value,
      cache_status: statusPayload.cache_status,
      metadata: { tone: statusPayload.tone || 'neutral' },
    })
  } catch (err) {
    error.value = err.message || t('votePanel.unavailable')
    trackEvent('tooltip_status_loaded', {
      source: 'extension',
      feature: 'tooltip',
      url: newsUrl.value,
      success: false,
      metadata: { reason: 'load_failed' },
    })
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
        <a class="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-100" href="/" target="_blank" rel="noopener noreferrer">
          <img class="h-5 w-5 shrink-0" src="/brand/truthshield-mark.svg" alt="" />
          <span>TruthShield</span>
        </a>
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

      <div class="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-semibold text-zinc-300">{{ t('votePanel.readerReactionTitle') }}</p>
          <p class="text-[11px] text-zinc-500">{{ t('votePanel.readerReactionHoverHint') }}</p>
        </div>
        <div v-if="hoverReactions.length" class="mt-2 flex items-center gap-2">
          <span
            v-for="row in hoverReactions"
            :key="`${row.key}-${row.strength}`"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-lg"
            :title="reactionTitle(row)"
            :aria-label="reactionTitle(row)"
          >
            {{ row.emoji }}
          </span>
        </div>
        <p v-else class="mt-2 text-[11px] text-zinc-500">{{ t('votePanel.readerReactionEmpty') }}</p>
      </div>
    </section>
  </main>
</template>
