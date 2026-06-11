<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { fetchJournalist } from '../lib/api'

const route = useRoute()
const journalist = ref(null)
const stats = ref(null)
const pendingCandidates = ref(0)
const loading = ref(true)
const error = ref('')

const articles = computed(() => stats.value?.articles || [])
const trackedTagName = computed(() => stats.value?.tracked_tag?.name || '標題殺人')

function ratioLabel(payload) {
  if (!payload?.ratio_available) return `樣本不足（至少 ${payload?.min_sample_size || 10} 篇）`
  return `${payload.tracked_tag_ratio}%`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchJournalist(route.params.id)
    journalist.value = payload.data
    stats.value = payload.stats
    pendingCandidates.value = payload.pending_candidates_count || 0
  } catch {
    error.value = '記者統計詳情暫時無法載入。'
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
        <RouterLink class="text-sm text-zinc-400" to="/stats/media">媒體統計</RouterLink>
      </AppNav>

      <div v-if="loading" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">載入中...</div>
      <p v-else-if="error" class="rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{{ error }}</p>
      <template v-else>
        <p class="text-sm font-semibold text-cyan-200">記者詳情</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">{{ journalist?.display_name }} 的報導標籤統計</h1>
        <p class="mt-2 text-sm text-zinc-400">
          {{ journalist?.media_outlet?.name || '未標媒體' }} · 待確認候選 {{ pendingCandidates }} 筆。待確認資料不納入正式比例。
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-4">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">納入統計</p>
            <p class="mt-1 text-2xl font-semibold text-white">{{ stats.article_count }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ trackedTagName }}</p>
            <p class="mt-1 text-2xl font-semibold text-white">{{ stats.tracked_tag_count }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">比例</p>
            <p class="mt-1 text-xl font-semibold text-white">{{ ratioLabel(stats) }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">最近 90 天</p>
            <p class="mt-1 text-xl font-semibold text-white">{{ stats.recent_90_days?.article_count || 0 }} 篇</p>
          </div>
        </div>

        <div class="mt-6 space-y-3">
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
                <p class="text-zinc-400">有效票數 {{ article.vote_count }}</p>
                <p class="mt-1 text-zinc-400">最高標籤：{{ article.top_tag?.name || '尚無' }}</p>
                <p class="mt-1 font-semibold" :class="article.tracked_tag_effective ? 'text-amber-200' : 'text-zinc-500'">
                  {{ trackedTagName }} {{ article.tracked_tag_effective ? '達門檻' : '未達門檻' }}
                </p>
              </div>
            </div>
          </article>
          <div v-if="!articles.length" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">目前沒有可顯示的已確認新聞列表。</div>
        </div>
      </template>
    </section>
  </main>
</template>
