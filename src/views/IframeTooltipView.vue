<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsStatus } from '../lib/api'

const route = useRoute()
const loading = ref(true)
const statusLoading = ref(true)
const error = ref('')
const status = ref(null)

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
      throw new Error('缺少 news_url')
    }

    const statusPayload = await fetchNewsStatus(newsUrl.value)
    status.value = statusPayload
  } catch (err) {
    error.value = err.message || '無法載入狀態'
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
        <span class="text-xs text-zinc-500">{{ statusLoading ? '檢查中' : '即時' }}</span>
      </div>

      <div class="w-full rounded-md border p-3 text-left" :class="toneClass">
        <div v-if="statusLoading" class="text-sm text-zinc-300">正在查核此連結...</div>
        <div v-else-if="error" class="text-sm text-orange-100">暫時無法取得標籤</div>
        <div v-else class="space-y-1">
          <div class="text-sm font-semibold">{{ status?.display_text || '尚無足夠投票資料' }}</div>
          <div class="text-xs opacity-80">進入新聞頁閱讀後可投票</div>
        </div>
      </div>
    </section>
  </main>
</template>
