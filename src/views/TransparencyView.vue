<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTransparency } from '../lib/api'
import { useI18n } from '../i18n'

const stats = ref(null)
const error = ref('')
const { t } = useI18n()

const sections = [
  {
    titleKey: 'transparency.systemScale',
    descriptionKey: 'transparency.systemScaleDesc',
    keys: ['users', 'news_urls', 'votes', 'read_sessions', 'trusted_evidence', 'finalized_news', 'news_snapshots', 'changed_news_snapshots', 'unavailable_news'],
  },
  {
    titleKey: 'transparency.governanceStatus',
    descriptionKey: 'transparency.governanceStatusDesc',
    keys: ['pending_domain_reports', 'pending_news_change_reports', 'reviewed_news_change_reports', 'pending_evidence_reports', 'open_abuse_events', 'pending_appeals', 'pending_user_data_requests', 'pending_verified_claimants', 'approved_verified_claimants', 'pending_official_responses', 'published_official_responses', 'official_response_reactions', 'moderation_events_24h', 'audit_events_24h', 'governance_pressure_score', 'governance_distribution', 'official_response_distribution', 'claimant_distribution'],
  },
  {
    titleKey: 'transparency.communityAutomation',
    descriptionKey: 'transparency.communityAutomationDesc',
    keys: ['community_open_tasks', 'community_escalated_tasks', 'community_resolved_tasks', 'community_signals', 'community_authenticated_signals', 'community_demoted_evidence', 'community_signal_abuse_events'],
  },
  {
    titleKey: 'transparency.riskMonitoring',
    descriptionKey: 'transparency.riskMonitoringDesc',
    keys: ['account_edges', 'high_risk_account_edges', 'extension_failures_24h', 'operational_events_24h', 'selector_failures_24h', 'bot_challenges_24h', 'bot_blocks_24h', 'bot_protection_distribution'],
  },
  {
    titleKey: 'transparency.policyAndWeight',
    descriptionKey: 'transparency.policyAndWeightDesc',
    keys: ['active_api_clients', 'active_trusted_evidence_sources', 'active_rate_limit_policies', 'unread_notifications', 'weight_distribution'],
  },
  {
    titleKey: 'transparency.funding',
    descriptionKey: 'transparency.fundingDesc',
    keys: ['donation_total_amount', 'donation_paid_count', 'donation_month_amount'],
  },
]

const visibleSections = computed(() => sections.map((section) => ({
  ...section,
  items: section.keys
    .filter((key) => stats.value && Object.prototype.hasOwnProperty.call(stats.value, key))
    .map((key) => ({ key, value: stats.value[key] })),
})))

function labelFor(key) {
  return t(`transparency.labels.${key}`)
}

function distributionLabelFor(key) {
  return t(`transparency.distribution.${key}`)
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
    error.value = err.message || t('transparency.loadFailed')
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">{{ t('common.evidenceLibrary') }}</RouterLink>
      </nav>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white">{{ t('transparency.title') }}</h1>
          <p class="mt-2 text-sm text-zinc-400">{{ t('transparency.intro') }}</p>
        </div>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/moderation-events">
          {{ t('transparency.viewModeration') }}
        </RouterLink>
      </div>

      <div v-if="error" class="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="!stats" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">{{ t('common.loading') }}</div>

      <div v-else class="mt-6 space-y-6">
        <section v-for="section in visibleSections" :key="section.titleKey" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-white">{{ t(section.titleKey) }}</h2>
            <p class="mt-1 text-sm text-zinc-500">{{ t(section.descriptionKey) }}</p>
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
