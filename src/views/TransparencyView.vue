<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTransparency } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

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
    keys: ['pending_domain_reports', 'pending_news_change_reports', 'reviewed_news_change_reports', 'pending_evidence_reports', 'open_abuse_events', 'pending_appeals', 'pending_user_data_requests', 'open_bug_reports', 'open_security_reports', 'critical_bug_reports', 'pending_verified_claimants', 'approved_verified_claimants', 'pending_official_responses', 'published_official_responses', 'official_response_reactions', 'moderation_events_24h', 'audit_events_24h', 'governance_pressure_score', 'governance_distribution', 'bug_report_distribution', 'official_response_distribution', 'claimant_distribution'],
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
    titleKey: 'transparency.trafficStats',
    descriptionKey: 'transparency.trafficStatsDesc',
    keys: ['today_api_requests', 'today_status_queries', 'cache_hit_rate', 'today_active_extension_clients', 'today_banner_views', 'today_tooltip_views', 'today_vote_panel_opens', 'today_votes', 'today_evidence_submissions', 'today_reports', 'extension_zip_downloads_today', 'error_rate'],
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

const publicCommunityCards = computed(() => {
  const metrics = stats.value?.community_metrics || {}
  const contributors = metrics.contributors_total || {}
  const activity = metrics.activity_30d || {}
  const tasks = metrics.task_totals || {}

  return [
    { key: 'registered_users_total', value: metrics.registered_users_total ?? 0 },
    { key: 'active_registered_users_7d', value: metrics.active_registered_users_7d ?? 0 },
    { key: 'active_registered_users_30d', value: metrics.active_registered_users_30d ?? 0 },
    { key: 'active_extension_clients_7d', value: metrics.active_extension_clients_7d ?? 0 },
    { key: 'active_extension_clients_30d', value: metrics.active_extension_clients_30d ?? 0 },
    { key: 'voters_total', value: contributors.voters ?? 0 },
    { key: 'evidence_submitters_total', value: contributors.evidence_submitters ?? 0 },
    { key: 'evidence_reviewers_total', value: contributors.evidence_reviewers ?? 0 },
    { key: 'votes_30d', value: activity.votes ?? 0 },
    { key: 'evidence_submissions_30d', value: activity.evidence_submissions ?? 0 },
    { key: 'evidence_reactions_30d', value: activity.evidence_reactions ?? 0 },
    { key: 'open_community_tasks', value: tasks.open ?? 0 },
  ]
})

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
      <AppNav>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">{{ t('common.evidenceLibrary') }}</RouterLink>
      </AppNav>

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
        <section class="rounded-lg border border-emerald-300/25 bg-emerald-300/[0.06] p-4">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-white">{{ t('transparency.publicCommunity') }}</h2>
            <p class="mt-1 text-sm leading-6 text-emerald-50/75">{{ t('transparency.publicCommunityDesc') }}</p>
            <p class="mt-2 text-xs leading-5 text-emerald-100/70">{{ t('transparency.publicCommunityPrivacyNote') }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="item in publicCommunityCards" :key="item.key" class="rounded-md border border-emerald-200/15 bg-zinc-950/70 p-4">
              <p class="text-xs font-semibold text-emerald-100/70">{{ labelFor(item.key) }}</p>
              <p class="mt-2 break-words text-2xl font-semibold text-white">{{ Number(item.value || 0).toLocaleString() }}</p>
            </div>
          </div>
        </section>

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
