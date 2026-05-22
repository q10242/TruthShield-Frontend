<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createEvent,
  createEventEntity,
  createEventRelationship,
  createEventTimelineEntry,
  fetchEventGraph,
  fetchEvents,
} from '../lib/api'
import { currentLocale } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const route = useRoute()
const zh = currentLocale() !== 'en'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(readUser())
const events = ref([])
const selectedEventId = ref('')
const graph = ref({ entities: [], relationships: [] })
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const message = ref('')
const createdEventId = ref(null)

const mode = computed(() => route.query.mode === 'graph' ? 'graph' : 'timeline')
const newsUrl = computed(() => route.query.news_url || '')
const pageTitle = computed(() => route.query.title_snapshot || route.query.page_title || '')
const eventSearch = ref(pageTitle.value || '')
const isLoggedIn = computed(() => Boolean(token.value && user.value))
const eventOptions = computed(() => events.value || [])
const selectedEvent = computed(() => eventOptions.value.find((event) => String(event.id) === String(selectedEventId.value)))

const eventName = ref('')
const eventSummary = ref('')
const timelineTitle = ref(pageTitle.value || (zh ? '新聞事件' : 'News event'))
const timelineSummary = ref('')
const occurredAt = ref(new Date().toISOString().slice(0, 16))
const sourceType = ref('news')
const sourceUrl = ref(newsUrl.value)

const entityName = ref('')
const entityType = ref('person')
const toEntityId = ref('')
const relationshipType = ref('')
const relationshipDescription = ref('')
const relationshipSourceUrl = ref(newsUrl.value)

const text = {
  title: zh ? '加入事件' : 'Add to Event',
  timelineTitle: zh ? '加入事件時間線' : 'Add to Event Timeline',
  graphTitle: zh ? '加入人物/組織關係圖' : 'Add to People/Org Graph',
  login: zh ? '登入後才能提交事件編輯。' : 'Sign in to submit event edits.',
  selectEvent: zh ? '選擇既有事件' : 'Select existing event',
  searchEvent: zh ? '搜尋事件' : 'Search events',
  searchEventPlaceholder: zh ? '輸入事件、人物、組織或新聞關鍵字' : 'Search events, people, organizations, or articles',
  createEvent: zh ? '或建立新事件' : 'Or create a new event',
  eventName: zh ? '事件名稱' : 'Event name',
  eventSummary: zh ? '事件摘要' : 'Event summary',
  entryTitle: zh ? '時間線標題' : 'Entry title',
  summary: zh ? '摘要' : 'Summary',
  time: zh ? '時間點' : 'Time',
  sourceUrl: zh ? '參考資料 URL' : 'Source URL',
  entity: zh ? '人名或組織名' : 'Person or organization name',
  entityType: zh ? '類型' : 'Type',
  relatedTo: zh ? '跟誰有關係' : 'Related to',
  relationship: zh ? '關係' : 'Relationship',
  description: zh ? '說明' : 'Description',
  submit: zh ? '加入事件' : 'Add to Event',
  loading: zh ? '載入中...' : 'Loading...',
  firstNode: zh ? '這張圖還沒有節點，這次會先建立第一個人物/組織節點。' : 'This graph has no nodes yet. This submission will create the first node.',
  viewEvent: zh ? '查看事件頁' : 'Open event page',
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function resize() {
  const height = Math.min(720, Math.max(420, document.documentElement.scrollHeight || 620))
  window.parent?.postMessage({ type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE', height, collapsed: false }, '*')
}

async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchEvents({ q: eventSearch.value || pageTitle.value || '', limit: 30 })
    events.value = payload.data || []
    const preselect = route.query.event_id ? String(route.query.event_id) : null
    if (preselect && events.value.some((e) => String(e.id) === preselect)) {
      selectedEventId.value = preselect
    } else if (!selectedEventId.value && events.value[0]) {
      selectedEventId.value = String(events.value[0].id)
    }
    await loadGraph()
  } catch (err) {
    error.value = err.message || 'Failed to load events'
  } finally {
    loading.value = false
    setTimeout(resize, 50)
  }
}

async function loadGraph() {
  if (!selectedEventId.value || mode.value !== 'graph') {
    graph.value = { entities: [], relationships: [] }
    return
  }
  graph.value = await fetchEventGraph(selectedEventId.value)
  if (!toEntityId.value && graph.value.entities?.[0]) toEntityId.value = String(graph.value.entities[0].id)
}

async function ensureEvent() {
  if (selectedEventId.value) return selectedEventId.value
  const name = eventName.value.trim()
  if (!name) throw new Error(zh ? '請選擇事件或輸入新事件名稱。' : 'Select an event or enter a new event name.')

  const payload = await createEvent(token.value, {
    name,
    summary: eventSummary.value || timelineSummary.value || relationshipDescription.value || undefined,
    news_url: newsUrl.value,
    title_snapshot: pageTitle.value || undefined,
  })
  const id = payload.data?.id
  createdEventId.value = id
  selectedEventId.value = String(id)
  return id
}

async function submitTimeline() {
  const id = await ensureEvent()
  await createEventTimelineEntry(token.value, id, {
    title: timelineTitle.value,
    summary: timelineSummary.value,
    occurred_at: new Date(occurredAt.value).toISOString(),
    source_type: sourceType.value,
    source_url: sourceUrl.value,
    news_url: newsUrl.value,
  })
  createdEventId.value = id
}

async function submitGraph() {
  const id = await ensureEvent()
  await loadGraph()
  if (!graph.value.entities?.length) {
    await createEventEntity(token.value, id, {
      name: entityName.value,
      entity_type: entityType.value,
      description: relationshipDescription.value || undefined,
      source_url: relationshipSourceUrl.value,
    })
    createdEventId.value = id
    return
  }

  await createEventRelationship(token.value, id, {
    from_entity_name: entityName.value,
    from_entity_type: entityType.value,
    to_entity_id: toEntityId.value,
    relationship_type: relationshipType.value,
    description: relationshipDescription.value || undefined,
    source_type: 'news',
    source_url: relationshipSourceUrl.value,
    news_url: newsUrl.value,
  })
  createdEventId.value = id
}

async function submit() {
  if (!isLoggedIn.value) {
    error.value = text.login
    return
  }

  submitting.value = true
  error.value = ''
  message.value = ''
  try {
    if (mode.value === 'graph') {
      await submitGraph()
    } else {
      await submitTimeline()
    }
    message.value = zh ? '已加入事件，編輯紀錄已保存。' : 'Added to event. The edit log was saved.'
    await loadEvents()
  } catch (err) {
    error.value = err.message || 'Submit failed'
  } finally {
    submitting.value = false
    setTimeout(resize, 50)
  }
}

watch(selectedEventId, loadGraph)
onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED' && event.data.token) {
      token.value = event.data.token
      user.value = event.data.user || null
      localStorage.setItem(TOKEN_KEY, event.data.token)
      if (event.data.user) localStorage.setItem(USER_KEY, JSON.stringify(event.data.user))
    }
    if (event.data?.type === 'TRUTH_SHIELD_AUTH_CLEARED') {
      token.value = ''
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  })
  loadEvents()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 p-4 text-zinc-100">
    <div class="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
      <div>
        <p class="text-xs font-semibold text-cyan-300">TruthShield</p>
        <h1 class="text-lg font-semibold text-white">{{ mode === 'graph' ? text.graphTitle : text.timelineTitle }}</h1>
      </div>
      <a v-if="createdEventId" class="rounded-md border border-cyan-300/40 px-2 py-1 text-xs font-semibold text-cyan-100" :href="`/events/${createdEventId}`" target="_blank">{{ text.viewEvent }}</a>
    </div>

    <div v-if="!isLoggedIn" class="mt-4 rounded-md border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">{{ text.login }}</div>
    <div v-if="error" class="mt-4 rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</div>
    <div v-if="message" class="mt-4 rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">{{ message }}</div>

    <div v-if="loading" class="mt-4 text-sm text-zinc-400">{{ text.loading }}</div>
    <form v-else class="mt-4 space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="text-xs font-semibold text-zinc-500">{{ text.selectEvent }}</span>
        <div class="mt-1 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input v-model="eventSearch" class="min-w-0 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :placeholder="text.searchEventPlaceholder" @keydown.enter.prevent="loadEvents" />
          <button type="button" class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" @click="loadEvents">{{ text.searchEvent }}</button>
        </div>
        <select v-model="selectedEventId" class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="">{{ text.createEvent }}</option>
          <option v-for="item in eventOptions" :key="item.id" :value="String(item.id)">{{ item.name }} · {{ zh ? '觀看' : 'views' }} {{ item.view_count ?? 0 }}</option>
        </select>
      </label>

      <div v-if="!selectedEventId" class="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.eventName }}</span>
          <input v-model="eventName" required class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.eventSummary }}</span>
          <textarea v-model="eventSummary" class="mt-1 min-h-16 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"></textarea>
        </label>
      </div>

      <template v-if="mode === 'timeline'">
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.entryTitle }}</span>
          <input v-model="timelineTitle" required class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.summary }}</span>
          <textarea v-model="timelineSummary" required class="mt-1 min-h-20 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"></textarea>
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.time }}</span>
          <input v-model="occurredAt" required type="datetime-local" class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.sourceUrl }}</span>
          <input v-model="sourceUrl" required type="url" class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
      </template>

      <template v-else>
        <p v-if="selectedEventId && !graph.entities?.length" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">{{ text.firstNode }}</p>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.entity }}</span>
          <input v-model="entityName" required class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.entityType }}</span>
          <select v-model="entityType" class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
            <option value="person">{{ zh ? '人物' : 'Person' }}</option>
            <option value="organization">{{ zh ? '組織' : 'Organization' }}</option>
          </select>
        </label>
        <label v-if="graph.entities?.length" class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.relatedTo }}</span>
          <select v-model="toEntityId" required class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
            <option v-for="entity in graph.entities" :key="entity.id" :value="String(entity.id)">{{ entity.name }} · {{ entity.entity_type }}</option>
          </select>
        </label>
        <label v-if="graph.entities?.length" class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.relationship }}</span>
          <input v-model="relationshipType" required class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :placeholder="zh ? '例如：任職於、澄清、指控、隸屬' : 'e.g. works for, clarifies, accuses, affiliated with'" />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.description }}</span>
          <textarea v-model="relationshipDescription" class="mt-1 min-h-20 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"></textarea>
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-zinc-500">{{ text.sourceUrl }}</span>
          <input v-model="relationshipSourceUrl" required type="url" class="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
      </template>

      <button class="w-full rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60" :disabled="submitting || !isLoggedIn" type="submit">
        {{ submitting ? (zh ? '送出中...' : 'Submitting...') : text.submit }}
      </button>
    </form>
  </main>
</template>
