<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTransparency } from '../lib/api'

const stats = ref(null)

const labels = {
  users: '使用者',
  news_urls: '新聞 URL',
  votes: '投票',
  read_sessions: '閱讀紀錄',
  trusted_evidence: '可信證據',
  unread_notifications: '未讀通知',
  finalized_news: '已定案新聞',
  pending_domain_reports: '待審新聞站回報',
  pending_evidence_reports: '待審證據檢舉',
  open_abuse_events: '待處理濫用事件',
  pending_appeals: '待審申訴',
  moderation_events_24h: '24 小時審核事件',
  extension_failures_24h: '24 小時插件失敗',
  audit_events_24h: '24 小時稽核事件',
  account_edges: '帳號關聯',
  high_risk_account_edges: '高風險帳號關聯',
  active_api_clients: '啟用 API Client',
  operational_events_24h: '24 小時營運事件',
  selector_failures_24h: '24 小時 selector 失敗',
  active_trusted_evidence_sources: '啟用可信證據來源',
  active_rate_limit_policies: '啟用限流政策',
  weight_distribution: '權重狀態分布',
}

const distributionLabels = {
  normal: '正常',
  watched: '觀察中',
  limited: '限權',
  suspended_weight: '暫停權重',
}

function labelFor(key) {
  return labels[key] || key
}

function distributionLabelFor(key) {
  return distributionLabels[key] || key
}

function isDistribution(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function distributionRows(value) {
  const entries = Object.entries(value || {})
  const total = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0)

  return entries.map(([key, count]) => ({
    key,
    label: distributionLabelFor(key),
    count: Number(count || 0),
    percentage: total > 0 ? Math.round((Number(count || 0) / total) * 100) : 0,
  }))
}

onMounted(async () => {
  stats.value = await fetchTransparency()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">證據庫</RouterLink>
      </nav>

      <h1 class="text-3xl font-semibold text-white">透明儀表板</h1>
      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(value, key) in stats || {}" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="text-xs font-semibold text-zinc-500">{{ labelFor(key) }}</p>

          <div v-if="isDistribution(value)" class="mt-4 space-y-3">
            <div v-for="row in distributionRows(value)" :key="row.key" class="space-y-1">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-zinc-300">{{ row.label }}</span>
                <span class="font-semibold text-white">{{ row.count }}</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${row.percentage}%` }"></div>
              </div>
            </div>
          </div>

          <p v-else class="mt-2 break-words text-2xl font-semibold text-white">{{ value }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
