<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchSystemHealth } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const health = ref(null)
const { t } = useI18n()
const labels = {
  ok: 'remaining.overall',
  database: 'remaining.database',
  cache: 'remaining.cache',
}
const countLabels = {
  pending_donations: 'remaining.pendingDonations',
  paid_donations_24h: 'remaining.paidDonations24h',
  pending_user_data_requests: 'remaining.pendingDataRequests',
  pending_evidence_snapshots: 'remaining.pendingEvidenceSnapshots',
  expired_unfinalized_news: 'remaining.expiredUnfinalizedNews',
}
const queueLabels = {
  connection: 'remaining.connection',
  pending_jobs: 'remaining.pendingJobs',
  failed_jobs: 'remaining.failedJobs',
  healthy: 'remaining.healthy',
  latest_worker_heartbeat_at: 'remaining.latestWorkerHeartbeat',
}

function labelCount(key) {
  return countLabels[key] ? t(countLabels[key]) : key
}

function labelQueue(key) {
  return queueLabels[key] ? t(queueLabels[key]) : key
}

function displayValue(value) {
  if (value === true) return t('remaining.normal')
  if (value === false) return t('remaining.abnormal')
  return value ?? t('remaining.none')
}

onMounted(async () => {
  health.value = await fetchSystemHealth()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <AppNav />
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.healthTitle') }}</h1>
      <div v-if="health" class="mt-6 grid gap-3 sm:grid-cols-3">
        <div v-for="key in ['ok', 'database', 'cache']" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="text-xs text-zinc-500">{{ t(labels[key]) }}</p>
          <p class="mt-2 text-2xl font-semibold" :class="health[key] ? 'text-emerald-300' : 'text-red-300'">{{ health[key] ? t('remaining.normal') : t('remaining.abnormal') }}</p>
        </div>
      </div>
      <div v-if="health && !health.ok" class="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        {{ t('remaining.degraded') }}
        <span v-if="health.degraded_reasons?.length"> · {{ health.degraded_reasons.join(', ') }}</span>
      </div>
      <div v-if="health" class="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <p class="text-xs text-zinc-500">{{ t('remaining.governancePressureScore') }}</p>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full" :class="health.governance_pressure_score >= 70 ? 'bg-red-400' : health.governance_pressure_score >= 40 ? 'bg-amber-300' : 'bg-emerald-300'" :style="{ width: `${Math.min(100, health.governance_pressure_score || 0)}%` }"></div>
        </div>
        <p class="mt-2 text-sm text-zinc-300">{{ health.governance_pressure_score || 0 }} / 100</p>
      </div>
      <div v-if="health" class="mt-6 grid gap-6 lg:grid-cols-2">
        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">{{ t('remaining.queue') }}</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div v-for="(value, key) in health.queue" :key="key">
              <p class="text-xs text-zinc-500">{{ labelQueue(key) }}</p>
              <p class="mt-1 text-sm text-zinc-200">{{ displayValue(value) }}</p>
            </div>
          </div>
        </section>
        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">{{ t('remaining.counts') }}</h2>
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
