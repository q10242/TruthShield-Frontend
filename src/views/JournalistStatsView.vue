<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { fetchJournalists } from '../lib/api'

const q = ref('')
const rows = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')

function ratioLabel(stats) {
  if (!stats?.ratio_available) return `樣本不足（至少 ${stats?.min_sample_size || 10} 篇）`
  return `${stats.tracked_tag_ratio}%`
}

function confidenceLabel(value) {
  return {
    insufficient: '樣本不足',
    low: '低',
    medium: '中',
    high: '高',
  }[value] || value || '未知'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchJournalists({ q: q.value, per_page: 50 })
    rows.value = payload.data || []
    meta.value = payload.meta || null
  } catch {
    error.value = '記者統計暫時無法載入。'
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
        <RouterLink class="text-sm text-zinc-400" to="/stats/media">媒體統計</RouterLink>
      </AppNav>

      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold text-cyan-200">公開統計</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">記者報導標籤統計</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            只統計已確認作者對應的收錄新聞。疑似對應、被回報或已拒絕的資料不會納入正式比例。
          </p>
        </div>
        <form class="flex gap-2" @submit.prevent="load">
          <input
            v-model="q"
            class="min-w-0 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="搜尋記者"
            aria-label="搜尋記者"
          />
          <button class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60" :disabled="loading">
            {{ loading ? '載入中' : '搜尋' }}
          </button>
        </form>
      </div>

      <p v-if="error" class="mt-4 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{{ error }}</p>
      <p v-if="meta" class="mt-4 text-xs text-zinc-500">共 {{ meta.total }} 筆記者資料，預設以已確認收錄篇數排序。</p>

      <div class="mt-6 grid gap-3">
        <article v-for="row in rows" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="font-semibold text-white">{{ row.display_name }}</h2>
              <p class="mt-1 text-xs text-zinc-500">
                {{ row.media_outlet?.name || '未標媒體' }} · 已確認 {{ row.confirmed_news_count || 0 }} 篇 · 待確認 {{ row.suspected_news_count || 0 }} 筆
              </p>
            </div>
            <RouterLink class="text-sm font-semibold text-cyan-200 hover:text-cyan-100" :to="`/stats/journalists/${row.id}`">查看詳情</RouterLink>
          </div>
          <div class="mt-4 grid gap-2 sm:grid-cols-4">
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">納入統計</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ row.stats?.article_count || 0 }}</p>
            </div>
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">{{ row.stats?.tracked_tag?.name || '標題殺人' }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ row.stats?.tracked_tag_count || 0 }}</p>
            </div>
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">比例</p>
              <p class="mt-1 text-lg font-semibold text-white">{{ ratioLabel(row.stats) }}</p>
            </div>
            <div class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">樣本信心</p>
              <p class="mt-1 text-lg font-semibold text-white">{{ confidenceLabel(row.stats?.sample_confidence) }}</p>
            </div>
          </div>
        </article>
        <div v-if="!loading && !rows.length" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          目前沒有符合條件的記者統計。
        </div>
      </div>
    </section>
  </main>
</template>
