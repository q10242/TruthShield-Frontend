<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchEvents } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const { locale } = useI18n()
const zh = computed(() => locale.value !== 'en')
const q = ref('')
const sort = ref('updated')
const page = ref(1)
const perPage = 20
const loading = ref(false)
const error = ref('')
const events = ref([])
const meta = ref({ total: 0, last_page: 1, page: 1 })

const text = computed(() => ({
  title: zh.value ? '事件時間線與關係圖' : 'Event Timelines and Relationship Graphs',
  intro: zh.value
    ? '把多篇新聞、證據、官方澄清與人物/組織關係收斂到同一個事件，讓社群一起維護脈絡。'
    : 'Group related articles, evidence, responses, and people/organization relationships into shared community-maintained events.',
  search: zh.value ? '搜尋事件、新聞、人物或組織' : 'Search events, articles, people, or organizations',
  empty: zh.value ? '目前沒有符合條件的事件。' : 'No matching events yet.',
  open: zh.value ? '查看事件' : 'Open event',
  timeline: zh.value ? '時間線' : 'Timeline',
  graph: zh.value ? '關係圖' : 'Graph',
  items: zh.value ? '資料' : 'Items',
  views: zh.value ? '瀏覽' : 'Views',
  updated: zh.value ? '更新' : 'Updated',
}))

const sortOptions = computed(() => [
  { value: 'updated', label: zh.value ? '最新更新' : 'Recently updated' },
  { value: 'created', label: zh.value ? '最新建立' : 'Newest' },
  { value: 'views', label: zh.value ? '瀏覽次數' : 'Most viewed' },
  { value: 'recent', label: zh.value ? '近期瀏覽' : 'Recently viewed' },
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchEvents({ q: q.value, sort: sort.value, per_page: perPage, page: page.value })
    events.value = payload.data || []
    meta.value = payload.meta || { total: 0, last_page: 1, page: 1 }
  } catch (err) {
    error.value = err.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
}

function setSort(value) {
  sort.value = value
  page.value = 1
  load()
}

function goPage(p) {
  page.value = p
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(zh.value ? 'zh-TW' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <AppNav>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/news-search">{{ zh ? '新聞搜尋' : 'News Search' }}</RouterLink>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/community-tasks">{{ zh ? '社群任務' : 'Community Tasks' }}</RouterLink>
      </AppNav>

      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p class="text-sm font-semibold text-cyan-300">TruthShield Events</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">{{ text.title }}</h1>
          <p class="mt-3 text-sm leading-7 text-zinc-400">{{ text.intro }}</p>
        </div>
        <form class="rounded-lg border border-white/10 bg-white/[0.03] p-4" @submit.prevent="page = 1; load()">
          <label class="text-xs font-semibold text-zinc-500">{{ text.search }}</label>
          <div class="mt-2 flex gap-2">
            <input v-model="q" class="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
            <button class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" type="submit">{{ zh ? '搜尋' : 'Search' }}</button>
          </div>
        </form>
      </div>

      <!-- sort bar -->
      <div class="mt-6 flex items-center gap-2">
        <span class="text-xs text-zinc-500">{{ zh ? '排序：' : 'Sort:' }}</span>
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          type="button"
          class="rounded-md border px-3 py-1 text-xs font-semibold transition-colors"
          :class="sort === opt.value
            ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100'
            : 'border-white/10 text-zinc-400 hover:border-cyan-300/40 hover:text-zinc-200'"
          @click="setSort(opt.value)"
        >
          {{ opt.label }}
        </button>
        <span class="ml-auto text-xs text-zinc-600">{{ zh ? `共 ${meta.total} 筆` : `${meta.total} events` }}</span>
      </div>

      <div v-if="error" class="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="mt-4 rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ zh ? '載入中...' : 'Loading...' }}</div>
      <div v-else class="mt-4 grid gap-4">
        <div v-if="events.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">{{ text.empty }}</div>
        <article v-for="event in events" :key="event.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="rounded bg-cyan-300/10 px-2 py-1 font-semibold text-cyan-100">{{ event.status }}</span>
                <span v-if="event.is_disputed" class="rounded bg-amber-500/10 px-2 py-1 font-semibold text-amber-100">{{ zh ? '爭議中' : 'Disputed' }}</span>
              </div>
              <h2 class="mt-3 text-xl font-semibold text-white">{{ event.name }}</h2>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ event.summary || (zh ? '尚未補充摘要。' : 'No summary yet.') }}</p>
            </div>
            <RouterLink class="rounded-md border border-cyan-300/40 px-3 py-2 text-sm font-semibold text-cyan-100" :to="`/events/${event.id}`">{{ text.open }}</RouterLink>
          </div>
          <div class="mt-4 grid gap-2 text-sm sm:grid-cols-5">
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.items }}</p><p class="mt-1 text-lg font-semibold">{{ event.counts.items ?? 0 }}</p></div>
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.timeline }}</p><p class="mt-1 text-lg font-semibold">{{ event.counts.timeline ?? 0 }}</p></div>
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.graph }}</p><p class="mt-1 text-lg font-semibold">{{ event.counts.relationships ?? 0 }}</p></div>
            <div
              class="rounded-md border p-3 transition-colors"
              :class="sort === 'views' || sort === 'recent' ? 'border-cyan-300/30 bg-cyan-300/5' : 'border-white/10 bg-zinc-950/70'"
            >
              <p class="text-zinc-500">{{ text.views }}</p>
              <p class="mt-1 text-lg font-semibold">{{ (event.view_count ?? 0).toLocaleString() }}</p>
            </div>
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.updated }}</p><p class="mt-1 text-xs font-semibold">{{ formatDate(event.last_activity_at || event.created_at) }}</p></div>
          </div>
        </article>

        <!-- pagination -->
        <div v-if="meta.last_page > 1" class="mt-2 flex items-center justify-center gap-1">
          <button
            class="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-30"
            :disabled="page <= 1"
            @click="goPage(page - 1)"
          >{{ zh ? '上一頁' : 'Prev' }}</button>
          <button
            v-for="p in meta.last_page"
            :key="p"
            class="rounded-md border px-3 py-1.5 text-sm font-semibold"
            :class="p === page ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-zinc-400 hover:border-cyan-300/40 hover:text-zinc-200'"
            @click="goPage(p)"
          >{{ p }}</button>
          <button
            class="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-30"
            :disabled="page >= meta.last_page"
            @click="goPage(page + 1)"
          >{{ zh ? '下一頁' : 'Next' }}</button>
        </div>
      </div>
    </section>
  </main>
</template>
