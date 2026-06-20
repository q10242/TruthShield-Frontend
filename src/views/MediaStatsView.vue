<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { fetchMediaOutlets } from '../lib/api'

const q = ref('')
const rows = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')

function confidenceLabel(value) {
  return { insufficient: '樣本不足', low: '低', medium: '中', high: '高' }[value] || value || '未知'
}

function topTag(stats) {
  return stats?.tag_distribution?.[0] ?? null
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchMediaOutlets({ q: q.value, per_page: 50 })
    rows.value = payload.data || []
    meta.value = payload.meta || null
  } catch {
    error.value = '媒體統計暫時無法載入。'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <AppNav>
        <RouterLink class="text-sm text-zinc-400" to="/stats/journalists">記者統計</RouterLink>
      </AppNav>

      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold text-cyan-200">公開統計</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">媒體報導標籤統計</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            這裡統計 TruthShield 已確認收錄新聞中的社群標籤結果，顯示的是報導標籤分布，不是媒體可信度排行。
          </p>
        </div>
        <form class="flex gap-2" @submit.prevent="load">
          <input
            v-model="q"
            class="min-w-0 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="搜尋媒體"
            aria-label="搜尋媒體"
          />
          <button class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60" :disabled="loading">
            {{ loading ? '載入中' : '搜尋' }}
          </button>
        </form>
      </div>

      <p v-if="error" class="mt-4 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{{ error }}</p>
      <p v-if="meta" class="mt-4 text-xs text-zinc-500">共 {{ meta.total }} 筆媒體，預設以收錄篇數排序。</p>

      <div class="mt-6 grid gap-3">
        <article v-for="row in rows" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="font-semibold text-white">{{ row.name }}</h2>
              <p class="mt-1 text-xs text-zinc-500">{{ row.region || '未標區域' }} · 已收錄新聞 {{ row.news_urls_count || 0 }} 篇</p>
            </div>
            <RouterLink class="text-sm font-semibold text-cyan-200 hover:text-cyan-100" :to="`/stats/media/${row.id}`">查看詳情</RouterLink>
          </div>
          <div class="mt-4 grid gap-2 sm:grid-cols-4">
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">納入統計</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ row.stats?.article_count || 0 }}</p>
            </div>
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">最高票標籤</p>
              <p class="mt-1 flex items-center gap-1.5 text-base font-semibold text-white">
                <span
                  v-if="topTag(row.stats)"
                  class="inline-block size-2 shrink-0 rounded-full"
                  :style="{ background: topTag(row.stats)?.color || '#67e8f9' }"
                />
                {{ topTag(row.stats)?.name || '尚無' }}
              </p>
            </div>
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">占比</p>
              <p class="mt-1 text-lg font-semibold text-white">
                {{ topTag(row.stats) ? `${topTag(row.stats).ratio}%` : (row.stats?.ratio_available ? '—' : `樣本不足`) }}
              </p>
            </div>
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">樣本信心</p>
              <p class="mt-1 text-lg font-semibold text-white">{{ confidenceLabel(row.stats?.sample_confidence) }}</p>
            </div>
          </div>
          <!-- Mini tag distribution bar -->
          <div v-if="row.stats?.tag_distribution?.length > 1" class="mt-3 flex h-1.5 w-full overflow-hidden rounded-full">
            <div
              v-for="tag in row.stats.tag_distribution.slice(0, 8)"
              :key="tag.tag_id"
              :title="`${tag.name} ${tag.ratio}%`"
              class="h-full transition-all"
              :style="{ width: `${tag.ratio}%`, background: tag.color || '#67e8f9' }"
            />
          </div>
        </article>
        <div v-if="!loading && !rows.length" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          目前沒有符合條件的媒體統計。
        </div>
      </div>
    </section>
  </main>
</template>
