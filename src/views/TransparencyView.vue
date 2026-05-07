<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTransparency } from '../lib/api'

const stats = ref(null)
const error = ref('')

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
  donation_total_amount: '累積捐款',
  donation_paid_count: '完成捐款筆數',
  donation_month_amount: '本月捐款',
  weight_distribution: '權重狀態分布',
}

const sections = [
  {
    title: '系統規模',
    description: '目前平台累積的新聞、投票、閱讀與證據資料。',
    keys: ['users', 'news_urls', 'votes', 'read_sessions', 'trusted_evidence', 'finalized_news'],
  },
  {
    title: '治理狀態',
    description: '待審、申訴、稽核與審核操作量。',
    keys: ['pending_domain_reports', 'pending_evidence_reports', 'open_abuse_events', 'pending_appeals', 'moderation_events_24h', 'audit_events_24h'],
  },
  {
    title: '風險監控',
    description: '帳號關聯、插件失敗與營運事件。',
    keys: ['account_edges', 'high_risk_account_edges', 'extension_failures_24h', 'operational_events_24h', 'selector_failures_24h'],
  },
  {
    title: '政策與權重',
    description: '目前啟用的政策、來源與帳號權重狀態。',
    keys: ['active_api_clients', 'active_trusted_evidence_sources', 'active_rate_limit_policies', 'unread_notifications', 'weight_distribution'],
  },
  {
    title: '營運資金',
    description: '公開捐款累積概況，正式上線後會搭配支出摘要。',
    keys: ['donation_total_amount', 'donation_paid_count', 'donation_month_amount'],
  },
]

const distributionLabels = {
  normal: '正常',
  watched: '觀察中',
  limited: '限權',
  suspended_weight: '暫停權重',
}

const visibleSections = computed(() => sections.map((section) => ({
  ...section,
  items: section.keys
    .filter((key) => stats.value && Object.prototype.hasOwnProperty.call(stats.value, key))
    .map((key) => ({ key, value: stats.value[key] })),
})))

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
  try {
    stats.value = await fetchTransparency()
  } catch (err) {
    error.value = err.message || '透明資料讀取失敗'
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">證據庫</RouterLink>
      </nav>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white">透明儀表板</h1>
          <p class="mt-2 text-sm text-zinc-400">公開系統規模、治理狀態、風險監控與權重分布。</p>
        </div>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/moderation-events">
          查看審核紀錄
        </RouterLink>
      </div>

      <div v-if="error" class="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="!stats" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">讀取中...</div>

      <div v-else class="mt-6 space-y-6">
        <section v-for="section in visibleSections" :key="section.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-white">{{ section.title }}</h2>
            <p class="mt-1 text-sm text-zinc-500">{{ section.description }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="item in section.items" :key="item.key" class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
              <p class="text-xs font-semibold text-zinc-500">{{ labelFor(item.key) }}</p>

              <div v-if="isDistribution(item.value)" class="mt-4 space-y-3">
                <div v-for="row in distributionRows(item.value)" :key="row.key" class="space-y-1">
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <span class="text-zinc-300">{{ row.label }}</span>
                    <span class="font-semibold text-white">{{ row.count }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${row.percentage}%` }"></div>
                  </div>
                </div>
              </div>

              <p v-else class="mt-2 break-words text-2xl font-semibold text-white">{{ item.value }}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
