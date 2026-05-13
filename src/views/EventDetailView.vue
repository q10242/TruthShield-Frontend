<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchEvent, fetchEventEditLogs, fetchEventGraph, fetchEventTimeline } from '../lib/api'
import { currentLocale } from '../i18n'

const route = useRoute()
const zh = currentLocale() !== 'en'
const activeTab = ref(route.query.tab || 'overview')
const event = ref(null)
const timeline = ref([])
const graph = ref({ entities: [], relationships: [] })
const logs = ref([])
const loading = ref(true)
const error = ref('')

const tabs = computed(() => [
  { key: 'overview', label: zh ? '總覽' : 'Overview' },
  { key: 'timeline', label: zh ? '時間線' : 'Timeline' },
  { key: 'graph', label: zh ? '人物/組織關係圖' : 'People/Org Graph' },
  { key: 'news', label: zh ? '相關新聞' : 'Related News' },
  { key: 'logs', label: zh ? '編輯紀錄' : 'Edit Logs' },
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id
    const [eventPayload, timelinePayload, graphPayload, logPayload] = await Promise.all([
      fetchEvent(id),
      fetchEventTimeline(id),
      fetchEventGraph(id),
      fetchEventEditLogs(id),
    ])
    event.value = eventPayload.data
    timeline.value = timelinePayload
    graph.value = graphPayload
    logs.value = logPayload
  } catch (err) {
    error.value = err.message || 'Failed to load event'
  } finally {
    loading.value = false
  }
}

function nodePosition(index, total) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2
  return {
    x: 260 + Math.cos(angle) * 180,
    y: 220 + Math.sin(angle) * 145,
  }
}

function entityPosition(id) {
  const index = (graph.value.entities || []).findIndex((entity) => entity.id === id)
  return nodePosition(Math.max(index, 0), graph.value.entities?.length || 1)
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <BrandLink />
        <div class="flex gap-3 text-sm">
          <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/events">{{ zh ? '事件列表' : 'Events' }}</RouterLink>
          <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/community-tasks">{{ zh ? '社群任務' : 'Community Tasks' }}</RouterLink>
        </div>
      </nav>

      <div v-if="error" class="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ zh ? '載入中...' : 'Loading...' }}</div>
      <template v-else-if="event">
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <p class="text-sm font-semibold text-cyan-300">TruthShield Event</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">{{ event.name }}</h1>
          <p class="mt-3 text-sm leading-7 text-zinc-400">{{ event.summary || (zh ? '這個事件還需要社群補充摘要。' : 'This event still needs a community summary.') }}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span class="rounded bg-cyan-300/10 px-2 py-1 font-semibold text-cyan-100">{{ event.status }}</span>
            <span v-if="event.is_disputed" class="rounded bg-amber-500/10 px-2 py-1 font-semibold text-amber-100">{{ zh ? '爭議中' : 'Disputed' }}</span>
            <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ zh ? '最後活動' : 'Last activity' }} {{ event.last_activity_at || event.created_at }}</span>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <button v-for="tab in tabs" :key="tab.key" class="rounded-md border px-3 py-2 text-sm font-semibold" :class="activeTab === tab.key ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300 hover:border-cyan-300/50'" @click="activeTab = tab.key">{{ tab.label }}</button>
        </div>

        <section v-if="activeTab === 'overview'" class="mt-6 grid gap-4 md:grid-cols-4">
          <div v-for="[key, value] in Object.entries(event.counts || {})" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ key }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ value ?? 0 }}</p>
          </div>
        </section>

        <section v-if="activeTab === 'timeline'" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div v-if="timeline.length === 0" class="text-sm text-zinc-400">{{ zh ? '尚無時間線項目。可從新聞右鍵 Pin 進來。' : 'No timeline entries yet. Pin one from a news page.' }}</div>
          <div v-else class="relative space-y-5 before:absolute before:left-3 before:top-1 before:h-full before:w-px before:bg-cyan-300/30">
            <article v-for="entry in timeline" :key="entry.id" class="relative pl-10">
              <span class="absolute left-0 top-1 h-6 w-6 rounded-full border border-cyan-300/50 bg-zinc-950"></span>
              <p class="text-xs text-zinc-500">{{ entry.occurred_at }} · {{ entry.source_type }}</p>
              <h2 class="mt-1 text-lg font-semibold text-white">{{ entry.title }}</h2>
              <p class="mt-1 text-sm leading-6 text-zinc-400">{{ entry.summary }}</p>
              <a v-if="entry.source_url" class="mt-2 inline-block break-all text-xs text-cyan-200 hover:text-cyan-100" :href="entry.source_url" target="_blank" rel="noopener noreferrer">{{ entry.source_url }}</a>
            </article>
          </div>
        </section>

        <section v-if="activeTab === 'graph'" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div v-if="(graph.entities || []).length === 0" class="text-sm text-zinc-400">{{ zh ? '尚無人物/組織節點。可從新聞右鍵 Pin 進來。' : 'No people or organization nodes yet. Pin one from a news page.' }}</div>
          <div v-else class="grid gap-5 lg:grid-cols-[620px_1fr]">
            <svg class="h-[460px] w-full rounded-lg border border-white/10 bg-zinc-950" viewBox="0 0 520 440" role="img">
              <line v-for="rel in graph.relationships" :key="rel.id" :x1="entityPosition(rel.from_entity_id).x" :y1="entityPosition(rel.from_entity_id).y" :x2="entityPosition(rel.to_entity_id).x" :y2="entityPosition(rel.to_entity_id).y" :stroke="rel.is_high_risk ? '#f97316' : '#67e8f9'" stroke-width="2" opacity="0.7" />
              <g v-for="(entity, index) in graph.entities" :key="entity.id">
                <circle :cx="nodePosition(index, graph.entities.length).x" :cy="nodePosition(index, graph.entities.length).y" :r="entity.entity_type === 'organization' ? 34 : 28" :fill="entity.entity_type === 'organization' ? '#164e63' : '#27272a'" stroke="#67e8f9" />
                <text :x="nodePosition(index, graph.entities.length).x" :y="nodePosition(index, graph.entities.length).y + 4" text-anchor="middle" fill="#fff" font-size="12">{{ entity.name.slice(0, 8) }}</text>
              </g>
            </svg>
            <div class="space-y-3">
              <article v-for="rel in graph.relationships" :key="rel.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-sm font-semibold text-white">{{ rel.from_entity?.name }} → {{ rel.to_entity?.name }}</p>
                <p class="mt-1 text-xs text-cyan-200">{{ rel.relationship_type }} <span v-if="rel.is_high_risk" class="text-amber-200">· {{ zh ? '高風險待確認' : 'High-risk review' }}</span></p>
                <p class="mt-2 text-sm text-zinc-400">{{ rel.description }}</p>
                <a class="mt-2 inline-block break-all text-xs text-zinc-500 hover:text-cyan-100" :href="rel.source_url" target="_blank" rel="noopener noreferrer">{{ rel.source_url }}</a>
              </article>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'news'" class="mt-6 grid gap-3">
          <article v-for="item in event.items || []" :key="item.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ item.item_type }}</p>
            <h2 class="mt-1 text-sm font-semibold text-white">{{ item.title || item.news_url?.title_snapshot || item.source_url }}</h2>
            <a v-if="item.source_url || item.news_url?.normalized_url" class="mt-2 inline-block break-all text-xs text-cyan-200" :href="item.source_url || item.news_url?.normalized_url" target="_blank" rel="noopener noreferrer">{{ item.source_url || item.news_url?.normalized_url }}</a>
          </article>
        </section>

        <section v-if="activeTab === 'logs'" class="mt-6 grid gap-3">
          <article v-for="log in logs" :key="log.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ log.action }}</span>
              <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ log.subject_type }} #{{ log.subject_id }}</span>
              <span class="text-zinc-500">{{ log.created_at }}</span>
            </div>
            <p class="mt-2 text-sm text-zinc-400">{{ log.reason }}</p>
            <p v-if="log.user" class="mt-2 text-xs text-zinc-500">{{ zh ? '編輯者' : 'Editor' }}：{{ log.user.name }} · Trust {{ log.user.trust_score }}</p>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>
