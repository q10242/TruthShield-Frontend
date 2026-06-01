<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { createEvent, fetchEventOptions, fetchEvents } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const TOKEN_KEY = 'truthshield_api_token'

const { locale } = useI18n()
const router = useRouter()
const zh = computed(() => locale.value !== 'en')
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const q = ref('')
const sort = ref('updated')
const categoryFilter = ref('')
const progressFilter = ref('')
const page = ref(1)
const perPage = 20
const loading = ref(false)
const error = ref('')
const events = ref([])
const eventOptions = ref({ primary_categories: [], tags: [], progress_statuses: [] })
const meta = ref({ total: 0, last_page: 1, page: 1 })
const createOpen = ref(false)
const createSubmitting = ref(false)
const createError = ref('')
const createMessage = ref('')
const createErrors = ref({})
const createForm = ref({
  name: '',
  summary: '',
  news_url: '',
  title_snapshot: '',
  primary_category: '',
  tags: [],
  progress_status: 'collecting',
})

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
  createTitle: zh.value ? '建立事件' : 'Create event',
  createIntro: zh.value
    ? '先用一篇公開新聞作為主要來源建立事件，之後可在事件頁補時間線、人物/組織與關係。'
    : 'Start with one public article as the primary source, then add timeline entries, people, organizations, and relationships.',
  createButton: zh.value ? '新增事件' : 'New event',
  createCta: zh.value ? '建立新事件' : 'Create new event',
  createClose: zh.value ? '收合' : 'Collapse',
  signInToCreate: zh.value ? '登入後可建立事件。' : 'Sign in to create events.',
  signIn: zh.value ? '登入' : 'Sign in',
  eventName: zh.value ? '事件名稱 *' : 'Event name *',
  eventSummary: zh.value ? '事件摘要' : 'Event summary',
  primaryUrl: zh.value ? '主要新聞 URL *' : 'Primary article URL *',
  primaryTitle: zh.value ? '新聞標題（選填）' : 'Article title optional',
  primaryCategory: zh.value ? '事件主分類' : 'Primary category',
  supplementalTags: zh.value ? '補充標籤' : 'Supplemental tags',
  progressStatus: zh.value ? '進度狀態' : 'Progress status',
  categoryFilter: zh.value ? '分類' : 'Category',
  progressFilter: zh.value ? '進度' : 'Progress',
  allCategories: zh.value ? '全部分類' : 'All categories',
  allProgress: zh.value ? '全部進度' : 'All progress',
  creating: zh.value ? '建立中...' : 'Creating...',
  createSuccess: zh.value ? '事件已建立，正在開啟事件頁。' : 'Event created. Opening the event page.',
  createFailed: zh.value ? '建立事件失敗。' : 'Failed to create event.',
}))

const sortOptions = computed(() => [
  { value: 'updated', label: zh.value ? '最新更新' : 'Recently updated' },
  { value: 'created', label: zh.value ? '最新建立' : 'Newest' },
  { value: 'views', label: zh.value ? '瀏覽次數' : 'Most viewed' },
  { value: 'recent', label: zh.value ? '近期瀏覽' : 'Recently viewed' },
])

const hasQuery = computed(() => q.value.trim().length > 0)
const canSubmitCreate = computed(() => Boolean(
  token.value &&
  createForm.value.name.trim() &&
  createForm.value.news_url.trim() &&
  !createSubmitting.value,
))
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
    const payload = await fetchEvents({
      q: q.value,
      sort: sort.value,
      primary_category: categoryFilter.value || undefined,
      progress_status: progressFilter.value || undefined,
      per_page: perPage,
      page: page.value,
    })
    events.value = payload.data || []
    meta.value = payload.meta || { total: 0, last_page: 1, page: 1 }
  } catch (err) {
    error.value = err.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    eventOptions.value = await fetchEventOptions()
  } catch {
    eventOptions.value = { primary_categories: [], tags: [], progress_statuses: [] }
  }
}

function fieldError(field) {
  const value = createErrors.value?.[field]
  return Array.isArray(value) ? value[0] : ''
}

async function submitCreate() {
  token.value = localStorage.getItem(TOKEN_KEY) || ''
  createError.value = ''
  createMessage.value = ''
  createErrors.value = {}

  if (!token.value) {
    router.push({ path: '/login', query: { redirect: '/events' } })
    return
  }

  if (!createForm.value.name.trim() || !createForm.value.news_url.trim()) {
    createError.value = zh.value ? '請填寫事件名稱與主要新聞 URL。' : 'Enter an event name and primary article URL.'
    return
  }

  createSubmitting.value = true
  try {
    const payload = await createEvent(token.value, {
      name: createForm.value.name.trim(),
      summary: createForm.value.summary.trim() || undefined,
      news_url: createForm.value.news_url.trim(),
      title_snapshot: createForm.value.title_snapshot.trim() || undefined,
      primary_category: createForm.value.primary_category || undefined,
      tags: createForm.value.tags,
      progress_status: createForm.value.progress_status || 'collecting',
    })
    createMessage.value = text.value.createSuccess
    createForm.value = { name: '', summary: '', news_url: '', title_snapshot: '', primary_category: '', tags: [], progress_status: 'collecting' }
    await load()
    const eventId = payload?.data?.id
    if (eventId) {
      router.push(`/events/${eventId}`)
    }
  } catch (err) {
    if (err.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      token.value = ''
      createError.value = zh.value ? '登入已失效，請重新登入後建立事件。' : 'Your session expired. Sign in again to create the event.'
      return
    }

    createErrors.value = err.errors || {}
    createError.value = err.message || text.value.createFailed
  } finally {
    createSubmitting.value = false
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
  categoryFilter.value = ''
  progressFilter.value = ''
  page.value = 1
  load()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(zh.value ? 'zh-TW' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  token.value = localStorage.getItem(TOKEN_KEY) || ''
  loadOptions()
  load()
})
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
        <div class="space-y-4">
          <form class="rounded-3xl border border-white/10 bg-white/[0.03] p-5" @submit.prevent="page = 1; load()">
            <label class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ text.search }}</label>
            <p class="mt-3 text-sm leading-6 text-zinc-400">{{ text.searchHint }}</p>
            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <input v-model="q" class="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300" :aria-label="text.search" />
              <div class="flex gap-2">
                <button class="flex-1 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 sm:flex-none" type="submit">{{ zh ? '搜尋' : 'Search' }}</button>
                <button v-if="hasQuery" class="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-cyan-300/40 hover:text-cyan-100" type="button" @click="resetSearch">{{ text.clear }}</button>
              </div>
            </div>
          </form>

          <section class="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-sm font-semibold text-cyan-100">{{ text.createTitle }}</p>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ text.createIntro }}</p>
              </div>
              <button
                v-if="token"
                type="button"
                class="shrink-0 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-zinc-950"
                @click="createOpen = !createOpen"
              >
                {{ createOpen ? text.createClose : text.createButton }}
              </button>
              <RouterLink
                v-else
                class="shrink-0 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-zinc-950"
                :to="{ path: '/login', query: { redirect: '/events' } }"
              >
                {{ text.signIn }}
              </RouterLink>
            </div>

            <p v-if="!token" class="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{{ text.signInToCreate }}</p>

            <form v-if="token && createOpen" class="mt-4 grid gap-3" @submit.prevent="submitCreate">
              <label class="grid gap-1.5 text-sm">
                <span class="text-zinc-300">{{ text.eventName }}</span>
                <input v-model="createForm.name" class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300" maxlength="160" required />
                <span v-if="fieldError('name')" class="text-xs text-red-300">{{ fieldError('name') }}</span>
              </label>
              <label class="grid gap-1.5 text-sm">
                <span class="text-zinc-300">{{ text.eventSummary }}</span>
                <textarea v-model="createForm.summary" rows="3" class="resize-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300" maxlength="2000"></textarea>
                <span v-if="fieldError('summary')" class="text-xs text-red-300">{{ fieldError('summary') }}</span>
              </label>
              <label class="grid gap-1.5 text-sm">
                <span class="text-zinc-300">{{ text.primaryUrl }}</span>
                <input v-model="createForm.news_url" type="url" class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300" required />
                <span v-if="fieldError('news_url')" class="text-xs text-red-300">{{ fieldError('news_url') }}</span>
              </label>
              <label class="grid gap-1.5 text-sm">
                <span class="text-zinc-300">{{ text.primaryTitle }}</span>
                <input v-model="createForm.title_snapshot" class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300" maxlength="255" />
                <span v-if="fieldError('title_snapshot')" class="text-xs text-red-300">{{ fieldError('title_snapshot') }}</span>
              </label>
              <div class="grid gap-3 md:grid-cols-2">
                <label class="grid gap-1.5 text-sm">
                  <span class="text-zinc-300">{{ text.primaryCategory }}</span>
                  <select v-model="createForm.primary_category" class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option value="">{{ text.allCategories }}</option>
                    <option v-for="option in eventOptions.primary_categories" :key="option.value" :value="option.value">{{ option.label }}</option>
                  </select>
                  <span v-if="fieldError('primary_category')" class="text-xs text-red-300">{{ fieldError('primary_category') }}</span>
                </label>
                <label class="grid gap-1.5 text-sm">
                  <span class="text-zinc-300">{{ text.progressStatus }}</span>
                  <select v-model="createForm.progress_status" class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option v-for="option in eventOptions.progress_statuses" :key="option.value" :value="option.value">{{ option.label }}</option>
                  </select>
                  <span v-if="fieldError('progress_status')" class="text-xs text-red-300">{{ fieldError('progress_status') }}</span>
                </label>
              </div>
              <label class="grid gap-1.5 text-sm">
                <span class="text-zinc-300">{{ text.supplementalTags }}</span>
                <select v-model="createForm.tags" multiple size="5" class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300">
                  <option v-for="option in eventOptions.tags" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <span v-if="fieldError('tags')" class="text-xs text-red-300">{{ fieldError('tags') }}</span>
              </label>
              <p v-if="createError" class="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{{ createError }}</p>
              <p v-if="createMessage" class="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{{ createMessage }}</p>
              <button class="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50" type="submit" :disabled="!canSubmitCreate">
                {{ createSubmitting ? text.creating : text.createCta }}
              </button>
            </form>
          </section>
        </div>
      </div>

      <div class="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ hasQuery ? text.searchResults : text.allEvents }}</p>
            <p class="mt-2 text-sm text-zinc-300">{{ resultSummary }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select v-model="categoryFilter" class="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 outline-none focus:border-cyan-300" @change="page = 1; load()">
              <option value="">{{ text.allCategories }}</option>
              <option v-for="option in eventOptions.primary_categories" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <select v-model="progressFilter" class="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 outline-none focus:border-cyan-300" @change="page = 1; load()">
              <option value="">{{ text.allProgress }}</option>
              <option v-for="option in eventOptions.progress_statuses" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
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
                <span v-if="event.primary_category_label" class="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-100">{{ event.primary_category_label }}</span>
                <span class="rounded-full bg-emerald-300/10 px-3 py-1 font-semibold text-emerald-100">{{ event.progress_status_label || statusLabel(event.progress_status) }}</span>
                <span v-if="event.is_disputed" class="rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-100">{{ text.disputed }}</span>
                <span class="rounded-full border border-white/10 px-3 py-1 text-zinc-400">{{ eventStateTone(event) }}</span>
              </div>
              <h2 class="mt-3 text-xl font-semibold text-white md:text-2xl">{{ event.name }}</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{{ event.summary || text.summaryFallback }}</p>
              <div v-if="event.tag_labels?.length" class="mt-3 flex flex-wrap gap-2 text-xs">
                <span v-for="label in event.tag_labels.slice(0, 3)" :key="label" class="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">{{ label }}</span>
              </div>
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
