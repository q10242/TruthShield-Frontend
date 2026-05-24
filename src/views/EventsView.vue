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
  searchHint: zh.value ? '可直接搜尋事件名稱、人物、組織，或近期爭議主題。' : 'Search by event name, public figure, organization, or an emerging controversy.',
  empty: zh.value ? '目前沒有符合條件的事件。' : 'No matching events yet.',
  open: zh.value ? '查看事件' : 'Open event',
  timeline: zh.value ? '時間線' : 'Timeline',
  graph: zh.value ? '關係圖' : 'Graph',
  items: zh.value ? '資料' : 'Items',
  views: zh.value ? '瀏覽' : 'Views',
  updated: zh.value ? '更新' : 'Updated',
  totalEvents: zh.value ? '社群事件總數' : 'Community events',
  reviewFlow: zh.value ? '跨新聞脈絡整理' : 'Cross-article context',
  reviewFlowDesc: zh.value ? '把時間線、人物關係與官方回應放在同一個頁面。' : 'Timelines, relationship maps, and official responses in one place.',
  clear: zh.value ? '清除' : 'Clear',
  searchResults: zh.value ? '搜尋結果' : 'Search results',
  allEvents: zh.value ? '全部事件' : 'All events',
  pageLabel: zh.value ? '頁面' : 'Page',
  ofLabel: zh.value ? '共' : 'of',
  summaryFallback: zh.value ? '尚未補充摘要。' : 'No summary yet.',
  activeNow: zh.value ? '最近活躍' : 'Active now',
  highTraffic: zh.value ? '高瀏覽' : 'High traffic',
  disputed: zh.value ? '爭議中' : 'Disputed',
}))

const sortOptions = computed(() => [
  { value: 'updated', label: zh.value ? '最新更新' : 'Recently updated' },
  { value: 'created', label: zh.value ? '最新建立' : 'Newest' },
  { value: 'views', label: zh.value ? '瀏覽次數' : 'Most viewed' },
  { value: 'recent', label: zh.value ? '近期瀏覽' : 'Recently viewed' },
])

const hasQuery = computed(() => q.value.trim().length > 0)
const activeSortLabel = computed(() => sortOptions.value.find((option) => option.value === sort.value)?.label || '')
const resultSummary = computed(() => {
  if (hasQuery.value) {
    return zh.value
      ? `「${q.value.trim()}」共有 ${meta.value.total} 筆結果`
      : `${meta.value.total} results for "${q.value.trim()}"`
  }

  return zh.value ? `目前收錄 ${meta.value.total} 個事件` : `${meta.value.total} events indexed`
})
const paginationNumbers = computed(() => {
  const total = Number(meta.value.last_page) || 1
  const current = Number(page.value) || 1
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((value) => pages.add(value))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((value) => pages.add(value))

  return Array.from(pages).filter((value) => value >= 1 && value <= total).sort((left, right) => left - right)
})

function statusLabel(status) {
  if (!status) return zh.value ? '進行中' : 'Active'
  const normalized = String(status).replace(/[_-]+/g, ' ').trim().toLowerCase()
  const map = {
    draft: zh.value ? '草稿' : 'Draft',
    active: zh.value ? '進行中' : 'Active',
    open: zh.value ? '開放中' : 'Open',
    monitoring: zh.value ? '監測中' : 'Monitoring',
    review: zh.value ? '審查中' : 'In review',
    verified: zh.value ? '已驗證' : 'Verified',
    resolved: zh.value ? '已結案' : 'Resolved',
    archived: zh.value ? '已封存' : 'Archived',
  }
  return map[normalized] || normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

function eventStateTone(event) {
  if (event.is_disputed) return text.value.disputed
  if ((event.view_count ?? 0) >= 100) return text.value.highTraffic
  return text.value.activeNow
}

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

function resetSearch() {
  q.value = ''
  page.value = 1
  load()
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

      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_38%),linear-gradient(145deg,rgba(6,182,212,0.12),rgba(24,24,27,0.9)_45%,rgba(9,9,11,0.96))] p-6 shadow-2xl shadow-cyan-950/30">
          <p class="text-sm font-semibold text-cyan-300">TruthShield Events</p>
          <h1 class="mt-2 max-w-2xl text-3xl font-semibold text-white md:text-4xl">{{ text.title }}</h1>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">{{ text.intro }}</p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ text.totalEvents }}</p>
              <p class="mt-2 text-3xl font-semibold text-white">{{ meta.total }}</p>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ hasQuery ? resultSummary : text.searchHint }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ text.reviewFlow }}</p>
              <p class="mt-2 text-lg font-semibold text-cyan-100">{{ activeSortLabel }}</p>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ text.reviewFlowDesc }}</p>
            </div>
          </div>
        </div>
        <form class="rounded-3xl border border-white/10 bg-white/[0.03] p-5" @submit.prevent="page = 1; load()">
          <label class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ text.search }}</label>
          <p class="mt-3 text-sm leading-6 text-zinc-400">{{ text.searchHint }}</p>
          <div class="mt-4 flex flex-col gap-2 sm:flex-row">
            <input v-model="q" class="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300" />
            <div class="flex gap-2">
              <button class="flex-1 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 sm:flex-none" type="submit">{{ zh ? '搜尋' : 'Search' }}</button>
              <button v-if="hasQuery" class="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-cyan-300/40 hover:text-cyan-100" type="button" @click="resetSearch">{{ text.clear }}</button>
            </div>
          </div>
        </form>
      </div>

      <div class="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ hasQuery ? text.searchResults : text.allEvents }}</p>
            <p class="mt-2 text-sm text-zinc-300">{{ resultSummary }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-zinc-500">{{ zh ? '排序：' : 'Sort:' }}</span>
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
              :class="sort === opt.value
                ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100'
                : 'border-white/10 text-zinc-400 hover:border-cyan-300/40 hover:text-zinc-200'"
              @click="setSort(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="mt-4 rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ zh ? '載入中...' : 'Loading...' }}</div>
      <div v-else class="mt-4 grid gap-4">
        <div v-if="events.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">{{ text.empty }}</div>
        <article v-for="event in events" :key="event.id" class="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-lg shadow-black/10">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-100">{{ statusLabel(event.status) }}</span>
                <span v-if="event.is_disputed" class="rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-100">{{ text.disputed }}</span>
                <span class="rounded-full border border-white/10 px-3 py-1 text-zinc-400">{{ eventStateTone(event) }}</span>
              </div>
              <h2 class="mt-3 text-xl font-semibold text-white md:text-2xl">{{ event.name }}</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{{ event.summary || text.summaryFallback }}</p>
            </div>
            <RouterLink class="rounded-xl border border-cyan-300/40 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/80 hover:bg-cyan-300/8" :to="`/events/${event.id}`">{{ text.open }}</RouterLink>
          </div>
          <div class="mt-5 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-2xl border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.items }}</p><p class="mt-1 text-lg font-semibold">{{ event.counts.items ?? 0 }}</p></div>
            <div class="rounded-2xl border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.timeline }}</p><p class="mt-1 text-lg font-semibold">{{ event.counts.timeline ?? 0 }}</p></div>
            <div class="rounded-2xl border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.graph }}</p><p class="mt-1 text-lg font-semibold">{{ event.counts.relationships ?? 0 }}</p></div>
            <div
              class="rounded-2xl border p-3 transition-colors"
              :class="sort === 'views' || sort === 'recent' ? 'border-cyan-300/30 bg-cyan-300/5' : 'border-white/10 bg-zinc-950/70'"
            >
              <p class="text-zinc-500">{{ text.views }}</p>
              <p class="mt-1 text-lg font-semibold">{{ (event.view_count ?? 0).toLocaleString() }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-zinc-950/70 p-3"><p class="text-zinc-500">{{ text.updated }}</p><p class="mt-1 text-xs font-semibold">{{ formatDate(event.last_activity_at || event.created_at) }}</p></div>
          </div>
        </article>

        <div v-if="meta.last_page > 1" class="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p class="text-xs text-zinc-500">{{ text.pageLabel }} {{ page }} {{ text.ofLabel }} {{ meta.last_page }}</p>
          <div class="flex flex-wrap items-center justify-center gap-1">
            <button
              class="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-400 hover:border-cyan-300/40 hover:text-cyan-100 disabled:opacity-30"
              :disabled="page <= 1"
              @click="goPage(page - 1)"
            >{{ zh ? '上一頁' : 'Prev' }}</button>
            <button
              v-for="p in paginationNumbers"
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
      </div>
    </section>
  </main>
</template>
