<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { fetchMediaOutletStats } from '../lib/api'

const route = useRoute()
// fetchMediaOutletStats spreads data fields + adds media key at top level
const stats = ref(null)
const loading = ref(true)
const error = ref('')
const selectedPeriod = ref('all_time')

const articles = computed(() => stats.value?.articles || [])

const periodData = computed(() => {
  if (!stats.value) return null
  const p = stats.value.periods?.[selectedPeriod.value]
  if (p) return p
  return {
    article_count: stats.value.article_count,
    tag_distribution: stats.value.tag_distribution || [],
  }
})

const pieSlices = computed(() => {
  const dist = periodData.value?.tag_distribution || []
  if (!dist.length) return []

  const topN = dist.slice(0, 7)
  const rest = dist.slice(7)
  const othersCount = rest.reduce((s, d) => s + d.article_count, 0)
  const othersRatio = rest.reduce((s, d) => s + d.ratio, 0)

  const data = othersCount > 0
    ? [...topN, { name: '其他', color: '#52525b', article_count: othersCount, ratio: Math.round(othersRatio * 10) / 10 }]
    : topN

  const total = data.reduce((s, d) => s + d.article_count, 0)
  if (total === 0) return []

  const cx = 90, cy = 90, r = 72
  let angle = -Math.PI / 2

  return data.map((d) => {
    const sweep = (d.article_count / total) * 2 * Math.PI
    const a2 = angle + sweep
    const x1 = (cx + r * Math.cos(angle)).toFixed(2)
    const y1 = (cy + r * Math.sin(angle)).toFixed(2)
    const x2 = (cx + r * Math.cos(a2)).toFixed(2)
    const y2 = (cy + r * Math.sin(a2)).toFixed(2)
    const large = sweep > Math.PI ? 1 : 0
    // ponytail: full-circle arc (sweep≈2π) can't arc start→start; use two semicircles
    const path = sweep < 0.005
      ? ''
      : sweep >= Math.PI * 2 - 0.01
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angle = a2
    return { name: d.name, color: d.color || '#67e8f9', article_count: d.article_count, ratio: d.ratio, path }
  }).filter((s) => s.path)
})

const PERIODS = [
  { key: 'all_time', label: '全部' },
  { key: 'last_90_days', label: '90 天' },
  { key: 'last_30_days', label: '30 天' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await fetchMediaOutletStats(route.params.id)
  } catch {
    error.value = '媒體統計詳情暫時無法載入。'
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
        <RouterLink class="text-sm text-zinc-400" to="/stats/journalists">記者統計</RouterLink>
      </AppNav>

      <div v-if="loading" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">載入中...</div>
      <p v-else-if="error" class="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{{ error }}</p>
      <template v-else>
        <p class="text-sm font-semibold text-cyan-200">媒體詳情</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">{{ stats?.media?.name || '媒體' }} 的報導標籤統計</h1>
        <p class="mt-2 text-sm text-zinc-400">以下統計基於已確認收錄的 {{ stats?.article_count || 0 }} 篇新聞，標籤分布由社群投票決定。</p>

        <!-- Period tabs -->
        <div class="mt-6 flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 w-fit">
          <button
            v-for="p in PERIODS"
            :key="p.key"
            class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
            :class="selectedPeriod === p.key
              ? 'bg-cyan-300 text-zinc-950'
              : 'text-zinc-400 hover:text-white'"
            @click="selectedPeriod = p.key"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Charts row -->
        <div class="mt-4 grid gap-4 lg:grid-cols-[200px_1fr]">
          <!-- Pie chart -->
          <div class="flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div v-if="pieSlices.length">
              <svg viewBox="0 0 180 180" class="w-[160px] h-[160px]" xmlns="http://www.w3.org/2000/svg">
                <path
                  v-for="(slice, i) in pieSlices"
                  :key="i"
                  :d="slice.path"
                  :fill="slice.color"
                  class="opacity-90 hover:opacity-100 transition-opacity"
                >
                  <title>{{ slice.name }} {{ slice.ratio }}%（{{ slice.article_count }} 篇）</title>
                </path>
              </svg>
              <p class="mt-2 text-center text-xs text-zinc-500">{{ periodData?.article_count || 0 }} 篇</p>
            </div>
            <p v-else class="text-sm text-zinc-500">尚無投票資料</p>
          </div>

          <!-- Legend / tag list -->
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">標籤分布</p>
            <div v-if="periodData?.tag_distribution?.length" class="space-y-2.5">
              <div
                v-for="tag in periodData.tag_distribution"
                :key="tag.tag_id"
                class="flex items-center gap-3"
              >
                <span class="inline-block size-2.5 shrink-0 rounded-full" :style="{ background: tag.color || '#67e8f9' }" />
                <span class="flex-1 min-w-0 truncate text-sm text-zinc-200">{{ tag.name }}</span>
                <span class="shrink-0 text-sm text-zinc-400">{{ tag.article_count }} 篇</span>
                <div class="w-20 shrink-0">
                  <div class="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full transition-all" :style="{ width: `${tag.ratio}%`, background: tag.color || '#67e8f9' }" />
                  </div>
                </div>
                <span class="w-10 shrink-0 text-right text-xs text-zinc-500">{{ tag.ratio }}%</span>
              </div>
            </div>
            <p v-else class="text-sm text-zinc-500">此時間段尚無資料</p>
          </div>
        </div>

        <!-- Article list -->
        <div class="mt-6 space-y-3">
          <p class="text-sm font-semibold text-zinc-400">近期收錄新聞（最多 50 篇）</p>
          <article v-for="article in articles" :key="article.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <h2 class="font-medium text-white">{{ article.title_snapshot || '未命名新聞' }}</h2>
                <a class="mt-1 block truncate text-sm text-cyan-200" :href="article.normalized_url" target="_blank" rel="noreferrer">{{ article.normalized_url }}</a>
                <div class="mt-2 flex flex-wrap gap-2">
                  <RouterLink v-for="event in article.events" :key="event.id" class="rounded border border-cyan-300/20 px-2 py-1 text-xs text-cyan-100" :to="`/events/${event.id}`">
                    {{ event.name }}
                  </RouterLink>
                </div>
              </div>
              <div class="shrink-0 text-left text-sm md:text-right">
                <p class="text-zinc-400">投票數 {{ article.vote_count }}</p>
                <p v-if="article.top_tag" class="mt-1 flex items-center justify-end gap-1.5">
                  <span class="inline-block size-2 rounded-full" :style="{ background: article.top_tag.color || '#67e8f9' }" />
                  <span class="font-semibold text-white">{{ article.top_tag.name }}</span>
                </p>
                <p v-else class="mt-1 text-zinc-500">尚無有效標籤</p>
              </div>
            </div>
          </article>
          <div v-if="!articles.length" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">目前沒有可顯示的新聞列表。</div>
        </div>
      </template>
    </section>
  </main>
</template>
