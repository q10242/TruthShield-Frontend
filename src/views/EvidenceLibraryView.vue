<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchEvidenceLibrary } from '../lib/api'

const items = ref([])
const meta = ref(null)
const loading = ref(true)
const q = ref('')
const tag = ref('')
const trusted = ref('')

async function load() {
  loading.value = true
  try {
    const payload = await fetchEvidenceLibrary({
      q: q.value,
      tag: tag.value,
      trusted: trusted.value,
    })
    items.value = payload.data || []
    meta.value = payload.meta || null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/ranking">媒體排行</RouterLink>
      </nav>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white">證據庫</h1>
          <p class="mt-2 text-sm text-zinc-400">依社群淨有用權重排序，保留截圖、雲端硬碟圖片與澄清連結。</p>
        </div>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/local-news-demo">
          提交測試證據
        </RouterLink>
      </div>

      <form class="mt-6 grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_160px_160px_auto]" @submit.prevent="load">
        <input v-model="q" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" placeholder="搜尋證據、URL、新聞標題" />
        <select v-model="tag" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="">全部標籤</option>
          <option value="clickbait-title">標題殺人</option>
          <option value="missing-context">隱瞞事實</option>
          <option value="out-of-context">斷章取義</option>
          <option value="accurate-reporting">事實準確</option>
        </select>
        <select v-model="trusted" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="">全部來源</option>
          <option value="1">可信來源</option>
          <option value="0">未驗證來源</option>
        </select>
        <button class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950">篩選</button>
      </form>

      <p v-if="meta" class="mt-3 text-xs text-zinc-500">共 {{ meta.total }} 筆，顯示上限 {{ meta.limit }} 筆</p>

      <div class="mt-6 grid gap-3">
        <div v-if="loading" class="rounded-lg border border-white/10 p-4 text-zinc-400">讀取中...</div>
        <div v-else-if="items.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          目前沒有符合條件的證據。調整篩選條件，或在新聞頁面閱讀後提交第一筆證據。
        </div>
        <article v-for="item in items" :key="item.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex items-center justify-between gap-4">
            <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold">{{ item.tag.name }}</span>
            <span class="text-xs" :class="item.is_trusted_evidence ? 'text-emerald-300' : 'text-zinc-500'">
              {{ item.is_trusted_evidence ? '可信來源' : '未驗證來源' }} · 淨權重 {{ Number(item.net_helpful_weight).toFixed(2) }}
            </span>
          </div>
          <p class="mt-3 text-sm text-zinc-200">{{ item.evidence_note || '未提供說明' }}</p>
          <a class="mt-2 block truncate text-sm font-semibold text-cyan-200" :href="item.evidence_url" target="_blank" rel="noreferrer">{{ item.evidence_url }}</a>
          <p class="mt-2 truncate text-xs text-zinc-500">{{ item.news_url?.title_snapshot || item.news_url?.normalized_url }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
