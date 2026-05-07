<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchSystemHealth } from '../lib/api'

const health = ref(null)
const labels = {
  ok: '整體',
  database: '資料庫',
  cache: '快取',
}
const countLabels = {
  pending_donations: '待確認捐款',
  paid_donations_24h: '24 小時完成捐款',
  pending_evidence_snapshots: '待處理證據快照',
  expired_unfinalized_news: '逾期未定案新聞',
}

function labelCount(key) {
  return countLabels[key] || key
}

onMounted(async () => {
  health.value = await fetchSystemHealth()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <nav class="mb-8 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">系統健康</h1>
      <div v-if="health" class="mt-6 grid gap-3 sm:grid-cols-3">
        <div v-for="key in ['ok', 'database', 'cache']" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="text-xs text-zinc-500">{{ labels[key] }}</p>
          <p class="mt-2 text-2xl font-semibold" :class="health[key] ? 'text-emerald-300' : 'text-red-300'">{{ health[key] ? 'OK' : 'FAIL' }}</p>
        </div>
      </div>
      <div v-if="health && !health.ok" class="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        系統處於降級狀態，請優先檢查 queue worker、Redis 與 PostgreSQL。
      </div>
      <div v-if="health" class="mt-6 grid gap-6 lg:grid-cols-2">
        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">Queue</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div v-for="(value, key) in health.queue" :key="key">
              <p class="text-xs uppercase text-zinc-500">{{ key }}</p>
              <p class="mt-1 text-sm text-zinc-200">{{ value ?? 'none' }}</p>
            </div>
          </div>
        </section>
        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">Counts</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div v-for="(value, key) in health.counts" :key="key">
              <p class="text-xs text-zinc-500">{{ labelCount(key) }}</p>
              <p class="mt-1 text-sm text-zinc-200">{{ value }}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
